const TrendChart = ({ trend }) => {
  const CONTAINER_HEIGHT = 140;
  const PADDING = 25;
  const MAX_HEIGHT = CONTAINER_HEIGHT - PADDING;

  const new_trend = trend.slice(-10);

  return (
    <div style={{
      background: '#1c1c1a',
      border: '1px solid #ddd',
      borderRadius: 10,
      padding: 30,
      marginBottom: 16,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: "#2d2c2c"
    }}>
      

      <div style={{
        position: 'relative',
        height: CONTAINER_HEIGHT,
        display: 'flex',
        alignItems: 'flex-end ',
        gap: 8,
        paddingBottom: 0
      }}>
        {new_trend.map((t) => {
          // const barHeight = Math.max((t.yesPct / 100) * MAX_HEIGHT, 5);
          const barHeight = (t.yesPct / 100) * MAX_HEIGHT;

          return (
            <div key={t.year} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              
              {/* Value label */}
              {barHeight > 25 && (
                <div style={{
                  position: 'absolute',
                  top: `${MAX_HEIGHT- barHeight - 50}px`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ffffff',
                  paddingBottom : 10
                }}>
                  {t.yesPct}%
                </div>
              )}

              {/* Bar */}
              <div style={{
                width: '60%',
                height: `${barHeight}px`,
                background: 'linear-gradient(180deg, #378ADD, #1E5FA0)',
                borderRadius: '4px 4px 0 0',
                boxShadow: '0 2px 4px rgba(55, 138, 221, 0.3)',
                border: '1px solid rgba(55, 138, 221, 0.2)',
                transition: 'height 0.3s ease'
              }} />

              {/* Year */}
              <div style={{
                fontSize: 11,
                marginTop: 4,
                color: '#666'
              }}>
                {String(t.year).slice(2)}
              </div>
            </div>
          );
        })}

        {/* Y-axis */}
        <div style={{
          position: 'relative',
          right: -15,
          bottom: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none'
        }}>
          {[100, 75, 50, 25, 0].map(val => (
            <div key={val} style={{ fontSize: 11, color: '#999' }}>
              {val}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TrendChart;