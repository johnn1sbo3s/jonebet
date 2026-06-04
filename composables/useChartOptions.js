export function useChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    transitions: {
      zoom: {
        animation: {
          duration: 1000,
          easing: "easeOutCubic",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        display: true,
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
          drag: {
            enabled: true,
            borderColor: "rgb(20 184 166)",
            borderWidth: 1,
            backgroundColor: "rgba(20, 184, 166, 0.15)",
          },
        },
        pan: {
          enabled: true,
          mode: "x",
          modifierKey: "ctrl",
        },
      },
      annotation: {
        annotations: {
          line1: {
            type: "line",
            xMin: -100,
            xMax: -100,
            borderColor: "rgb(20 184 166)",
            borderWidth: 2,
          },
        },
      },
    },
  };
}
