const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  "  const [chartData, setChartData] = useState<ChartData[]>([]);\n",
  "  const [chartData, setChartData] = useState<ChartData[]>([]);\n  const [pieData, setPieData] = useState<{name: string, value: number, color: string}[]>([]);\n"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
