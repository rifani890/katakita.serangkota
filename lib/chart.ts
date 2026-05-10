let chartSingleton: any = null;

export async function initChart(): Promise<any> {
  if (chartSingleton) return chartSingleton;

  const { Chart, registerables } = await import("chart.js");

  try {
    const ChartDataLabelsModule = await import("chartjs-plugin-datalabels");
    // plugin may export as default or named
    const ChartDataLabels = (ChartDataLabelsModule && (ChartDataLabelsModule as any).default) || ChartDataLabelsModule;
    Chart.register(...registerables, ChartDataLabels);
  } catch (err) {
    // If plugin isn't available or fails to load, at least register core registerables
    Chart.register(...registerables);
  }

  chartSingleton = Chart;
  return Chart;
}
