package com.un.explorer.service;

import com.un.explorer.model.*;
import com.un.explorer.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.zip.ZipInputStream;

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │           UN VOTE EXPLORER — DATA SEEDING STRATEGY                  │
 * │                                                                     │
 * │  We use TWO data sources:                                           │
 * │                                                                     │
 * │  1. Harvard Dataverse "unvotes" CSV (1946–2023)                    │
 * │     → 1 million rows of country-resolution-vote triples            │
 * │     → FREE, no key, direct download                                │
 * │     → URL: hdl:1902.1/12379 (Dataverse)                           │
 * │     → This is the PRIMARY vote data source                         │
 * │                                                                     │
 * │  2. UN Digital Library API                                          │
 * │     → Resolution titles, descriptions, dates                       │
 * │     → FREE, no key                                                 │
 * │     → Used to enrich resolution metadata                           │
 * │                                                                     │
 * │  3. World Bank API                                                  │
 * │     → GDP growth, trade data per country per year                  │
 * │     → FREE, no key                                                 │
 * │     → Used only by Trade War Dashboard feature (separate project)  │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * HOW TO RUN:
 *   POST /api/admin/seed/csv     → seed from Harvard Dataverse CSV
 *   POST /api/admin/seed/un-api  → enrich with UN API metadata
 *
 * Or call seedFromCsv() / enrichFromUnApi() programmatically on startup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataSeederService {

    // ─────────────────────────────────────────────────────────────────────────
    // Official UN Dag Hammarskjöld Library CSV — direct download, no API key needed.
    //
    // Source : https://digitallibrary.un.org/record/4060887
    // Covers : All UNGA resolutions from session 1 (Dec 1946) to session 80 (Dec 2025)
    // Rows   : ~947,000 entries — one row per country per resolution
    // License: Copyright United Nations; non-commercial use with attribution
    //
    // ⚠️  NOTE: The Harvard Dataverse link (doi:10.7910/DVN/LEJUQZ) is for ideal-point
    //    ESTIMATES only — NOT raw votes. The dataset author Erik Voeten himself
    //    now recommends this official UN DHL source for raw vote data.
    // ─────────────────────────────────────────────────────────────────────────
    private static final String UNVOTES_CSV_URL =
            "https://digitallibrary.un.org/record/4060887/files/2026_02_06_ga_voting.csv";
    private final CountryRepository    countryRepo;
    private final ResolutionRepository resolutionRepo;
    private final VoteRepository       voteRepo;
    private final TopicRepository      topicRepo;

    // ISO3 → Country entity map, built once during seeding
    private final Map<String, Country> countryCache = new HashMap<>();

    // Resolution number → Resolution entity map
    private final Map<String, Resolution> resolutionCache = new HashMap<>();

    // ─────────────────────────────────────────────────────────────────────────
    //  STEP 1: Seed countries
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Seed the countries table.
     * Uses a hardcoded list of UN member states with their ISO codes and regions.
     * (The World Bank API can also supply this — see WorldBankApiService.getCountryMetadata)
     * Seeds UN countries
     * Avoids duplicate insertion
     * Uses cache for fast access
     */
    @Transactional
    public void seedCountries() {
//        if (countryRepo.count() > 0) {
//            log.info("Countries already seeded ({} rows). Loading into cache.", countryRepo.count());
//            countryRepo.findAll().forEach(c -> countryCache.put(c.getIso3Code(), c));
//            return;
//        }
        log.info("Syncing countries...");

// Load existing countries into cache first
        countryRepo.findAll()
                .forEach(c -> countryCache.put(c.getIso3Code(), c));

        log.info("Seeding countries...");

        // Full UN member state list: name, iso2, iso3, region, year_joined
        Object[][] data = {
                {"Afghanistan",              "AF","AFG", Country.Region.Asia_Pacific,  1946},
                {"Albania",                  "AL","ALB", Country.Region.Europe,        1955},
                {"Algeria",                  "DZ","DZA", Country.Region.Africa,        1962},
                {"Angola",                   "AO","AGO", Country.Region.Africa,        1976},
                {"Argentina",                "AR","ARG", Country.Region.Americas,      1945},
                {"Australia",                "AU","AUS", Country.Region.Asia_Pacific,  1945},
                {"Austria",                  "AT","AUT", Country.Region.Europe,        1955},
                {"Bangladesh",               "BD","BGD", Country.Region.Asia_Pacific,  1974},
                {"Belarus",                  "BY","BLR", Country.Region.Europe,        1945},
                {"Belgium",                  "BE","BEL", Country.Region.Europe,        1945},
                {"Bolivia",                  "BO","BOL", Country.Region.Americas,      1945},
                {"Brazil",                   "BR","BRA", Country.Region.Americas,      1945},
                {"Cambodia",                 "KH","KHM", Country.Region.Asia_Pacific,  1955},
                {"Canada",                   "CA","CAN", Country.Region.Americas,      1945},
                {"Chile",                    "CL","CHL", Country.Region.Americas,      1945},
                {"China",                    "CN","CHN", Country.Region.Asia_Pacific,  1971},
                {"Colombia",                 "CO","COL", Country.Region.Americas,      1945},
                {"Cuba",                     "CU","CUB", Country.Region.Americas,      1945},
                {"Czechia",                  "CZ","CZE", Country.Region.Europe,        1993},
                {"Denmark",                  "DK","DNK", Country.Region.Europe,        1945},
                {"Egypt",                    "EG","EGY", Country.Region.Africa,        1945},
                {"Ethiopia",                 "ET","ETH", Country.Region.Africa,        1945},
                {"Finland",                  "FI","FIN", Country.Region.Europe,        1955},
                {"France",                   "FR","FRA", Country.Region.Europe,        1945},
                {"Germany",                  "DE","DEU", Country.Region.Europe,        1973},
                {"Ghana",                    "GH","GHA", Country.Region.Africa,        1957},
                {"Greece",                   "GR","GRC", Country.Region.Europe,        1945},
                {"Guatemala",                "GT","GTM", Country.Region.Americas,      1945},
                {"Hungary",                  "HU","HUN", Country.Region.Europe,        1955},
                {"India",                    "IN","IND", Country.Region.Asia_Pacific,  1945},
                {"Indonesia",                "ID","IDN", Country.Region.Asia_Pacific,  1950},
                {"Iran",                     "IR","IRN", Country.Region.Middle_East,   1945},
                {"Iraq",                     "IQ","IRQ", Country.Region.Middle_East,   1945},
                {"Ireland",                  "IE","IRL", Country.Region.Europe,        1955},
                {"Israel",                   "IL","ISR", Country.Region.Middle_East,   1949},
                {"Italy",                    "IT","ITA", Country.Region.Europe,        1955},
                {"Japan",                    "JP","JPN", Country.Region.Asia_Pacific,  1956},
                {"Jordan",                   "JO","JOR", Country.Region.Middle_East,   1955},
                {"Kenya",                    "KE","KEN", Country.Region.Africa,        1963},
                {"Kuwait",                   "KW","KWT", Country.Region.Middle_East,   1963},
                {"Lebanon",                  "LB","LBN", Country.Region.Middle_East,   1945},
                {"Libya",                    "LY","LBY", Country.Region.Africa,        1955},
                {"Malaysia",                 "MY","MYS", Country.Region.Asia_Pacific,  1957},
                {"Mexico",                   "MX","MEX", Country.Region.Americas,      1945},
                {"Morocco",                  "MA","MAR", Country.Region.Africa,        1956},
                {"Mozambique",               "MZ","MOZ", Country.Region.Africa,        1975},
                {"Netherlands",              "NL","NLD", Country.Region.Europe,        1945},
                {"New Zealand",              "NZ","NZL", Country.Region.Asia_Pacific,  1945},
                {"Nigeria",                  "NG","NGA", Country.Region.Africa,        1960},
                {"North Korea",              "KP","PRK", Country.Region.Asia_Pacific,  1991},
                {"Norway",                   "NO","NOR", Country.Region.Europe,        1945},
                {"Pakistan",                 "PK","PAK", Country.Region.Asia_Pacific,  1947},
                {"Palestine",                "PS","PSE", Country.Region.Middle_East,   2012},
                {"Peru",                     "PE","PER", Country.Region.Americas,      1945},
                {"Philippines",              "PH","PHL", Country.Region.Asia_Pacific,  1945},
                {"Poland",                   "PL","POL", Country.Region.Europe,        1945},
                {"Portugal",                 "PT","PRT", Country.Region.Europe,        1955},
                {"Qatar",                    "QA","QAT", Country.Region.Middle_East,   1971},
                {"Romania",                  "RO","ROU", Country.Region.Europe,        1955},
                {"Russia",                   "RU","RUS", Country.Region.Europe,        1945},
                {"Rwanda",                   "RW","RWA", Country.Region.Africa,        1962},
                {"Saudi Arabia",             "SA","SAU", Country.Region.Middle_East,   1945},
                {"Senegal",                  "SN","SEN", Country.Region.Africa,        1960},
                {"Singapore",                "SG","SGP", Country.Region.Asia_Pacific,  1965},
                {"South Africa",             "ZA","ZAF", Country.Region.Africa,        1945},
                {"South Korea",              "KR","KOR", Country.Region.Asia_Pacific,  1991},
                {"Spain",                    "ES","ESP", Country.Region.Europe,        1955},
                {"Sri Lanka",                "LK","LKA", Country.Region.Asia_Pacific,  1955},
                {"Sudan",                    "SD","SDN", Country.Region.Africa,        1956},
                {"Sweden",                   "SE","SWE", Country.Region.Europe,        1946},
                {"Switzerland",              "CH","CHE", Country.Region.Europe,        2002},
                {"Syria",                    "SY","SYR", Country.Region.Middle_East,   1945},
                {"Tanzania",                 "TZ","TZA", Country.Region.Africa,        1961},
                {"Thailand",                 "TH","THA", Country.Region.Asia_Pacific,  1946},
                {"Tunisia",                  "TN","TUN", Country.Region.Africa,        1956},
                {"Turkey",                   "TR","TUR", Country.Region.Middle_East,   1945},
                {"Uganda",                   "UG","UGA", Country.Region.Africa,        1962},
                {"Ukraine",                  "UA","UKR", Country.Region.Europe,        1945},
                {"United Arab Emirates",     "AE","ARE", Country.Region.Middle_East,   1971},
                {"United Kingdom",           "GB","GBR", Country.Region.Europe,        1945},
                {"United States",            "US","USA", Country.Region.Americas,      1945},
                {"Uruguay",                  "UY","URY", Country.Region.Americas,      1945},
                {"Venezuela",                "VE","VEN", Country.Region.Americas,      1945},
                {"Vietnam",                  "VN","VNM", Country.Region.Asia_Pacific,  1977},
                {"Yemen",                    "YE","YEM", Country.Region.Middle_East,   1947},
                {"Zambia",                   "ZM","ZMB", Country.Region.Africa,        1964},
                {"Zimbabwe",                 "ZW","ZWE", Country.Region.Africa,        1980},
//                New Countries
                // ── Missing countries to append ─────────────────────────────────────────────

                {"Andorra",                   "AD","AND", Country.Region.Europe,        1993},
                {"Antigua and Barbuda",       "AG","ATG", Country.Region.Americas,      1981},
                {"Armenia",                   "AM","ARM", Country.Region.Europe,        1992},
                {"Azerbaijan",                "AZ","AZE", Country.Region.Europe,        1992},
                {"Bahamas",                   "BS","BHS", Country.Region.Americas,      1973},
                {"Bahrain",                   "BH","BHR", Country.Region.Middle_East,   1971},
                {"Barbados",                  "BB","BRB", Country.Region.Americas,      1966},
                {"Belize",                    "BZ","BLZ", Country.Region.Americas,      1981},
                {"Benin",                     "BJ","BEN", Country.Region.Africa,        1960},
                {"Bhutan",                    "BT","BTN", Country.Region.Asia_Pacific,  1971},
                {"Bosnia and Herzegovina",    "BA","BIH", Country.Region.Europe,        1992},
                {"Botswana",                  "BW","BWA", Country.Region.Africa,        1966},
                {"Brunei Darussalam",         "BN","BRN", Country.Region.Asia_Pacific,  1984},
                {"Bulgaria",                  "BG","BGR", Country.Region.Europe,        1955},
                {"Burkina Faso",              "BF","BFA", Country.Region.Africa,        1960},
                {"Burundi",                   "BI","BDI", Country.Region.Africa,        1962},
                {"Cameroon",                  "CM","CMR", Country.Region.Africa,        1960},
                {"Cape Verde",                "CV","CPV", Country.Region.Africa,        1975},
                {"Central African Republic",  "CF","CAF", Country.Region.Africa,        1960},
                {"Chad",                      "TD","TCD", Country.Region.Africa,        1960},
                {"Comoros",                   "KM","COM", Country.Region.Africa,        1975},
                {"Congo",                     "CG","COG", Country.Region.Africa,        1960},
                {"Costa Rica",                "CR","CRI", Country.Region.Americas,      1945},
                {"Côte d'Ivoire",             "CI","CIV", Country.Region.Africa,        1960},
                {"Croatia",                   "HR","HRV", Country.Region.Europe,        1992},
                {"Cyprus",                    "CY","CYP", Country.Region.Europe,        1960},
                {"Democratic Republic of the Congo","CD","COD", Country.Region.Africa, 1960},
                {"Djibouti",                  "DJ","DJI", Country.Region.Africa,        1977},
                {"Dominica",                  "DM","DMA", Country.Region.Americas,      1978},
                {"Dominican Republic",        "DO","DOM", Country.Region.Americas,      1945},
                {"Ecuador",                   "EC","ECU", Country.Region.Americas,      1945},
                {"El Salvador",               "SV","SLV", Country.Region.Americas,      1945},
                {"Equatorial Guinea",         "GQ","GNQ", Country.Region.Africa,        1968},
                {"Eritrea",                   "ER","ERI", Country.Region.Africa,        1993},
                {"Estonia",                   "EE","EST", Country.Region.Europe,        1991},
                {"Fiji",                      "FJ","FJI", Country.Region.Asia_Pacific,  1970},
                {"Gabon",                     "GA","GAB", Country.Region.Africa,        1960},
                {"Gambia",                    "GM","GMB", Country.Region.Africa,        1965},
                {"Georgia",                   "GE","GEO", Country.Region.Europe,        1992},
                {"Grenada",                   "GD","GRD", Country.Region.Americas,      1974},
                {"Guinea",                    "GN","GIN", Country.Region.Africa,        1958},
                {"Guinea-Bissau",             "GW","GNB", Country.Region.Africa,        1974},
                {"Guyana",                    "GY","GUY", Country.Region.Americas,      1966},
                {"Haiti",                     "HT","HTI", Country.Region.Americas,      1945},
                {"Honduras",                  "HN","HND", Country.Region.Americas,      1945},
                {"Iceland",                   "IS","ISL", Country.Region.Europe,        1946},
                {"Jamaica",                   "JM","JAM", Country.Region.Americas,      1962},
                {"Kazakhstan",                "KZ","KAZ", Country.Region.Asia_Pacific,  1992},
                {"Kiribati",                  "KI","KIR", Country.Region.Asia_Pacific,  1999},
                {"Kyrgyzstan",                "KG","KGZ", Country.Region.Asia_Pacific,  1992},
                {"Laos",                      "LA","LAO", Country.Region.Asia_Pacific,  1955},
                {"Latvia",                    "LV","LVA", Country.Region.Europe,        1991},
                {"Lesotho",                   "LS","LSO", Country.Region.Africa,        1966},
                {"Liberia",                   "LR","LBR", Country.Region.Africa,        1945},
                {"Liechtenstein",             "LI","LIE", Country.Region.Europe,        1990},
                {"Lithuania",                 "LT","LTU", Country.Region.Europe,        1991},
                {"Luxembourg",                "LU","LUX", Country.Region.Europe,        1945},
                {"Madagascar",                "MG","MDG", Country.Region.Africa,        1960},
                {"Malawi",                    "MW","MWI", Country.Region.Africa,        1964},
                {"Maldives",                  "MV","MDV", Country.Region.Asia_Pacific,  1965},
                {"Mali",                      "ML","MLI", Country.Region.Africa,        1960},
                {"Malta",                     "MT","MLT", Country.Region.Europe,        1964},
                {"Marshall Islands",          "MH","MHL", Country.Region.Asia_Pacific,  1991},
                {"Mauritania",                "MR","MRT", Country.Region.Africa,        1961},
                {"Mauritius",                 "MU","MUS", Country.Region.Africa,        1968},
                {"Micronesia",                "FM","FSM", Country.Region.Asia_Pacific,  1991},
                {"Monaco",                    "MC","MCO", Country.Region.Europe,        1993},
                {"Mongolia",                  "MN","MNG", Country.Region.Asia_Pacific,  1961},
                {"Myanmar",                   "MM","MMR", Country.Region.Asia_Pacific,  1948},
                {"Namibia",                   "NA","NAM", Country.Region.Africa,        1990},
                {"Nauru",                     "NR","NRU", Country.Region.Asia_Pacific,  1999},
                {"Nepal",                     "NP","NPL", Country.Region.Asia_Pacific,  1955},
                {"Nicaragua",                 "NI","NIC", Country.Region.Americas,      1945},
                {"Niger",                     "NE","NER", Country.Region.Africa,        1960},
                {"Oman",                      "OM","OMN", Country.Region.Middle_East,   1971},
                {"Palau",                     "PW","PLW", Country.Region.Asia_Pacific,  1994},
                {"Panama",                    "PA","PAN", Country.Region.Americas,      1945},
                {"Papua New Guinea",          "PG","PNG", Country.Region.Asia_Pacific,  1975},
                {"Paraguay",                  "PY","PRY", Country.Region.Americas,      1945},
                {"Republic of Moldova",       "MD","MDA", Country.Region.Europe,        1992},
                {"Saint Kitts and Nevis",     "KN","KNA", Country.Region.Americas,      1983},
                {"Saint Lucia",               "LC","LCA", Country.Region.Americas,      1979},
                {"Saint Vincent and the Grenadines","VC","VCT", Country.Region.Americas, 1980},
                {"Samoa",                     "WS","WSM", Country.Region.Asia_Pacific,  1976},
                {"San Marino",                "SM","SMR", Country.Region.Europe,        1992},
                {"Sao Tome and Principe",     "ST","STP", Country.Region.Africa,        1975},
                {"Serbia and Montenegro",     "CS","SCG", Country.Region.Europe,        2003},
                {"Seychelles",                "SC","SYC", Country.Region.Africa,        1976},
                {"Sierra Leone",              "SL","SLE", Country.Region.Africa,        1961},
                {"Slovakia",                  "SK","SVK", Country.Region.Europe,        1993},
                {"Slovenia",                  "SI","SVN", Country.Region.Europe,        1992},
                {"Solomon Islands",           "SB","SLB", Country.Region.Asia_Pacific,  1978},
                {"Somalia",                   "SO","SOM", Country.Region.Africa,        1960},
                {"Suriname",                  "SR","SUR", Country.Region.Americas,      1975},
                {"Eswatini",                  "SZ","SWZ", Country.Region.Africa,        1968},
                {"Tajikistan",                "TJ","TJK", Country.Region.Asia_Pacific,  1992},
                {"Timor-Leste",               "TL","TLS", Country.Region.Asia_Pacific,  2002},
                {"Togo",                      "TG","TGO", Country.Region.Africa,        1960},
                {"Tonga",                     "TO","TON", Country.Region.Asia_Pacific,  1999},
                {"Trinidad and Tobago",       "TT","TTO", Country.Region.Americas,      1962},
                {"Turkmenistan",              "TM","TKM", Country.Region.Asia_Pacific,  1992},
                {"Tuvalu",                    "TV","TUV", Country.Region.Asia_Pacific,  2000},
                {"Uzbekistan",                "UZ","UZB", Country.Region.Asia_Pacific,  1992},
                {"Vanuatu",                   "VU","VUT", Country.Region.Asia_Pacific,  1981},
        };

        for (Object[] row : data) {
            String iso3 = (String) row[2];

            // Skip if already exists
            if (countryCache.containsKey(iso3)) {
                continue;
            }

            Country c = countryRepo.save(Country.builder()
                    .name((String) row[0])
                    .iso2Code((String) row[1])
                    .iso3Code((String) row[2])
                    .region((Country.Region) row[3])
                    .unMemberSince((Integer) row[4])
                    .build());
            countryCache.put(c.getIso3Code(), c);
        }

        log.info("Seeded {} countries.", countryCache.size());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  STEP 2: Seed topics
    // ─────────────────────────────────────────────────────────────────────────
//    Inserts topic categories
//    Avoids duplicates
//    Returns topic map for tagging
    @Transactional
    public Map<String, Topic> seedTopics() {
        Map<String, Topic> topicMap = new LinkedHashMap<>();
        for (String[] t : new String[][]{
                {"Human Rights",           "human_rights"},
                {"Nuclear Weapons",        "nuclear"},
                {"Climate & Environment",  "climate"},
                {"Palestine & Middle East","palestine"},
                {"Trade & Development",    "trade"},
                {"Peacekeeping",           "peacekeeping"},
                {"Arms Control",           "arms_control"},
                {"Decolonization",         "decolonization"},
        }) {
            Topic saved = topicRepo.findBySlug(t[1])
                    .orElseGet(() -> topicRepo.save(Topic.builder().name(t[0]).slug(t[1]).build()));
            topicMap.put(t[1], saved);
        }
        log.info("Seeded {} topics.", topicMap.size());
        return topicMap;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  STEP 3: Seed votes from Harvard Dataverse CSV
    //  This is the MAIN data ingestion — loads all 1M+ votes
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Download and parse the Harvard Dataverse "unvotes" CSV.
     *
     * CSV format (key columns):
     *   rcid         → resolution ID (numeric, used as our resolution_number base)
     *   session      → UN session number (e.g. 75 = 75th session)
     *   year         → vote year
     *   country_code → ISO3 country code (e.g. IND, USA, CHN)
     *   vote         → 1=yes, 2=abstain, 3=no, 8=absent, 9=not_member
     *   resid        → resolution string ID (e.g. "R/75/71")
     *   descr        → resolution description
     *   date         → vote date (YYYY-MM-DD)
     *   me           → topic flag: 1 if Palestinian conflict topic
     *   nu           → topic flag: 1 if nuclear weapons topic
     *   di           → topic flag: 1 if self-determination/decolonization
     *   hr           → topic flag: 1 if human rights
     *   co           → topic flag: 1 if colonialism
     *   ec           → topic flag: 1 if economic development
     *
     * @param localCsvPath If null, downloads from Harvard Dataverse.
     *                     Pass a local path for offline/testing use.
     */
    @Transactional
    public void seedFromCsv(String localCsvPath) throws Exception {
        log.info("Starting CSV seed. Source: {}", localCsvPath != null ? localCsvPath : "Harvard Dataverse");

        seedCountries();
        Map<String, Topic> topics = seedTopics();

        // ── Open the CSV ──────────────────────────────────────────────────────
        Reader reader;
        if (localCsvPath != null) {
            reader = new FileReader(localCsvPath, StandardCharsets.UTF_8);
        } else {
            log.info("Downloading CSV from Harvard Dataverse...");
            InputStream stream = new URL(UNVOTES_CSV_URL).openStream();
            reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
        }

        // ── Parse CSV (UN DHL format) ─────────────────────────────────────────
        //
        // Official UN Dag Hammarskjöld Library column schema (2026_02_06_ga_voting.csv):
        //   undl_id          → UN Digital Library control number
        //   ms_code          → ISO3 member state code (e.g. IND, USA, CHN)
        //   ms_name          → Official state name at time of vote
        //   ms_vote          → Y / N / A / X  (yes / no / abstain / non-voting)
        //   date             → YYYY-MM-DD
        //   session          → Session number (e.g. 78)
        //   resolution       → Resolution symbol (e.g. A/RES/78/240)
        //   draft            → Draft resolution symbol (may be empty)
        //   committee_report → Committee report symbol (may be empty)
        //   meeting          → Meeting record symbol
        //   title            → Full English resolution title ← use this for display
        //   agenda_title     → Agenda item title (may be empty)
        //   subjects         → Comma-separated subject keywords ← use for topic tagging
        //   vote_note        → Additional voting note (almost always empty)
        //   total_yes        → Total yes votes on this resolution
        //   total_no         → Total no votes
        //   total_abstentions→ Total abstentions
        //   total_non_voting → Total non-voting
        //   total_ms         → Total member states at time of vote
        //   undl_link        → Link to the record in UN Digital Library
        //
        try (BufferedReader br = new BufferedReader(reader)) {
            String header = br.readLine();
            if (header == null) throw new IOException("Empty CSV file");

            // Resolve column indices dynamically from the header row
            List<String> cols = Arrays.asList(header.split(","));
            int idxMsCode    = cols.indexOf("ms_code");      // ISO3 country code
            int idxMsVote    = cols.indexOf("ms_vote");      // Y / N / A / X
            int idxResolution= cols.indexOf("resolution");   // e.g. A/RES/78/240
            int idxTitle     = cols.indexOf("title");        // full resolution title
            int idxDate      = cols.indexOf("date");         // YYYY-MM-DD
            int idxSession   = cols.indexOf("session");      // session number → derive year
            int idxSubjects  = cols.indexOf("subjects");     // subject keywords for topic tagging
            int idxTotalYes  = cols.indexOf("total_yes");
            int idxTotalNo   = cols.indexOf("total_no");
            int idxTotalAbs  = cols.indexOf("total_abstentions");
            int idxTotalNv   = cols.indexOf("total_non_voting");

            List<Vote> voteBatch = new ArrayList<>();
            int totalVotes = 0;
            int skipped    = 0;

            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = parseCSVLine(line);
                if (parts.length < 4) { skipped++; continue; }

                String iso3Code    = safe(parts, idxMsCode);
                String voteRaw     = safe(parts, idxMsVote);      // Y / N / A / X
                String resSymbol   = safe(parts, idxResolution);  // e.g. A/RES/78/240
                String title       = safe(parts, idxTitle);
                String dateStr     = safe(parts, idxDate);
                String subjectsStr = safe(parts, idxSubjects);
                int    session     = parseIntSafe(safe(parts, idxSession), 0);
                // UN sessions start in September; session N ≈ year (1945 + N)
                int    year        = session > 0 ? 1945 + session : 0;

                // Skip if country unknown or non-voting placeholder
                Country country = countryCache.get(iso3Code);
                if (country == null || resSymbol.isEmpty()) { skipped++; continue; }

                Vote.VoteType voteType = parseVoteTypeDhl(voteRaw);

                // Get or create resolution (keyed by resolution symbol)
                Resolution resolution = resolutionCache.computeIfAbsent(resSymbol, k ->
                        resolutionRepo.findByResolutionNumber(resSymbol).orElseGet(() -> {
                            LocalDate voteDate = parseDateSafe(dateStr);

                            // Tag topics from the subjects field (keyword matching)
                            Set<Topic> resTopics = tagTopicsFromSubjects(subjectsStr, topics);

                            // Parse vote totals directly from the CSV (already aggregated)
                            int tYes = parseIntSafe(safe(parts, idxTotalYes), 0);
                            int tNo  = parseIntSafe(safe(parts, idxTotalNo),  0);
                            int tAbs = parseIntSafe(safe(parts, idxTotalAbs), 0);
                            int tNv  = parseIntSafe(safe(parts, idxTotalNv),  0);

                            String displayTitle = title.isEmpty() ? resSymbol : title;
                            if (displayTitle.length() > 290) displayTitle = displayTitle.substring(0, 290);

                            return resolutionRepo.save(Resolution.builder()
                                    .resolutionNumber(resSymbol)
                                    .title(displayTitle)
                                    .description(subjectsStr)
                                    .sessionYear(year)
                                    .voteDate(voteDate)
                                    .totalYes(tYes)
                                    .totalNo(tNo)
                                    .totalAbstain(tAbs)
                                    .totalAbsent(tNv)
                                    .topics(resTopics)
                                    .build());
                        })
                );

                // Update totals
//                updateTotals(resolution, voteType);

                // Build vote
//                voteBatch.add(Vote.builder()
//                        .resolution(resolution)
//                        .country(country)
//                        .voteType(voteType)
//                        .build());
                if (!voteRepo.existsByResolutionAndCountry(resolution, country)) {
                    voteBatch.add(Vote.builder()
                            .resolution(resolution)
                            .country(country)
                            .voteType(voteType)
                            .build());
                }
                totalVotes++;

                // Flush in batches of 500 to keep memory low
                if (voteBatch.size() >= 500) {
                    voteRepo.saveAll(voteBatch);
                    voteBatch.clear();
                    log.info("Saved {} votes so far...", totalVotes);
                }
            }

            // Save remaining
            if (!voteBatch.isEmpty()) voteRepo.saveAll(voteBatch);

            // Persist updated totals
            resolutionCache.values().forEach(resolutionRepo::save);

            log.info("CSV seed complete. {} votes saved. {} rows skipped.", totalVotes, skipped);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  STEP 4: Enrich resolution titles from UN API
    //  Run AFTER seedFromCsv to add proper English titles
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * For each year, call the UN Digital Library API to get proper resolution
     * titles and update our database.
     *
     * @param fromYear Start year (e.g. 2015)
     * @param toYear   End year   (e.g. 2023)
     */
//    @Transactional
//    public void enrichFromUnApi(int fromYear, int toYear) {
//        log.info("Enriching resolution titles from UN API ({}-{})...", fromYear, toYear);
//
//        for (int year = fromYear; year <= toYear; year++) {
//            int page = 1;
//            while (true) {
//                List<UnApiService.UnResolution> batch =
//                        unApiService.fetchResolutionsByYear(year, page, 50);
//
//                if (batch.isEmpty()) break;
//
//                for (UnApiService.UnResolution unRes : batch) {
//                    resolutionRepo.findByResolutionNumber(unRes.resolutionNumber())
//                            .ifPresent(existing -> {
//                                existing.setTitle(unRes.title());
//                                existing.setVoteDate(unRes.voteDate());
//                                resolutionRepo.save(existing);
//                            });
//                }
//
//                page++;
//
//                // Polite delay — don't hammer the UN API
//                try { Thread.sleep(300); } catch (InterruptedException ignored) {}
//            }
//
//            log.info("Enriched year {} from UN API.", year);
//        }
//
//        log.info("UN API enrichment complete.");
//    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse vote type from UN DHL CSV format.
     * UN DHL uses: Y = yes, N = no, A = abstain, X = non-voting (absent)
     */
    private Vote.VoteType parseVoteTypeDhl(String raw) {
        return switch (raw.trim().toUpperCase()) {
            case "Y"  -> Vote.VoteType.yes;
            case "N"  -> Vote.VoteType.no;
            case "A"  -> Vote.VoteType.abstain;
            default   -> Vote.VoteType.absent;  // "X" or empty = non-voting
        };
    }

    /**
     * Tag a resolution with topics by scanning its subjects field.
     * The UN DHL subjects column contains comma-separated keywords like:
     *   "NUCLEAR WEAPONS, DISARMAMENT, NON-PROLIFERATION"
     *   "HUMAN RIGHTS, WOMEN, REFUGEES"
     *   "PALESTINE, MIDDLE EAST, OCCUPIED TERRITORIES"
     */
    private Set<Topic> tagTopicsFromSubjects(String subjects, Map<String, Topic> topics) {
        Set<Topic> result = new HashSet<>();
        if (subjects == null || subjects.isBlank()) return result;
        String upper = subjects.toUpperCase();

        if (upper.contains("NUCLEAR") || upper.contains("NON-PROLIFERAT") || upper.contains("DISARMAMENT"))
            addTopic(result, topics, "nuclear");
        if (upper.contains("HUMAN RIGHTS") || upper.contains("TORTURE") || upper.contains("DETENTION"))
            addTopic(result, topics, "human_rights");
        if (upper.contains("PALESTIN") || upper.contains("GAZA") || upper.contains("OCCUPIED TERRIT"))
            addTopic(result, topics, "palestine");
        if (upper.contains("CLIMATE") || upper.contains("ENVIRONMENT") || upper.contains("SUSTAINABLE DEV"))
            addTopic(result, topics, "climate");
        if (upper.contains("TRADE") || upper.contains("DEVELOPMENT") || upper.contains("ECONOMIC"))
            addTopic(result, topics, "trade");
        if (upper.contains("PEACEKEEP") || upper.contains("PEACE OPERATION"))
            addTopic(result, topics, "peacekeeping");
        if (upper.contains("ARMS CONTROL") || upper.contains("WEAPONS") || upper.contains("CHEMICAL WEAPON"))
            addTopic(result, topics, "arms_control");
        if (upper.contains("COLONIAL") || upper.contains("SELF-DETERMIN") || upper.contains("DECOLONIZ"))
            addTopic(result, topics, "decolonization");

        return result;
    }

    /**
     * Legacy helper kept for backward compatibility.
     * Use parseVoteTypeDhl() for UN DHL CSV format.
     */
    private Vote.VoteType parseVoteType(String raw) {
        return switch (raw.trim()) {
            case "1"  -> Vote.VoteType.yes;
            case "2"  -> Vote.VoteType.abstain;
            case "3"  -> Vote.VoteType.no;
            default   -> Vote.VoteType.absent;
        };
    }

    private void updateTotals(Resolution r, Vote.VoteType type) {
        switch (type) {
            case yes     -> r.setTotalYes(r.getTotalYes() + 1);
            case no      -> r.setTotalNo(r.getTotalNo() + 1);
            case abstain -> r.setTotalAbstain(r.getTotalAbstain() + 1);
            case absent  -> r.setTotalAbsent(r.getTotalAbsent() + 1);
        }
    }

    private void addTopic(Set<Topic> set, Map<String, Topic> topics, String slug) {
        Topic t = topics.get(slug);
        if (t != null) set.add(t);
    }

    private LocalDate parseDateSafe(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.substring(0, 10)); } catch (Exception e) { return null; }
    }

    private int parseIntSafe(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return def; }
    }

    private String safe(String[] parts, int idx) {
        if (idx < 0 || idx >= parts.length) return "";
        return parts[idx].trim().replace("\"", "");
    }

    /** Handle quoted CSV fields (commas inside quotes) */
    private String[] parseCSVLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (char ch : line.toCharArray()) {
            if (ch == '"')         inQuotes = !inQuotes;
            else if (ch == ',' && !inQuotes) { fields.add(current.toString()); current.setLength(0); }
            else                   current.append(ch);
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }
}