const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const pieDataCalc = `    setChartData(dailyData);

    const categoryTotals: Record<string, number> = {};
    data.forEach(s => {
      const catId = s.categoryId || 'all';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + s.durationSeconds;
    });
    
    const newPieData = Object.entries(categoryTotals)
      .map(([catId, secs]) => ({
        name: CATEGORY_THEMES[catId]?.name || 'Khác',
        value: Number((secs / 3600).toFixed(1)),
        color: CATEGORY_THEMES[catId]?.accent || '#000000'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    setPieData(newPieData);`;

code = code.replace("    setChartData(dailyData);", pieDataCalc);

fs.writeFileSync('src/components/Dashboard.tsx', code);
