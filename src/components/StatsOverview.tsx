import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { algorithmPerformanceData } from "@/data/algorithmPerformanceData";

const StatsOverview = () => {
  const data = algorithmPerformanceData;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Algorithm Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[50, 80]} />
              <Tooltip
                formatter={(value, name) => [`${value}%`, 'Win Rate']}
                labelFormatter={(value) => `${value} League`}
              />
              <Bar 
                dataKey="winRate" 
                fill="#ffd700" 
                className="fill-gold-500 dark:fill-gold-400"
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {data.map((item) => (
            <div key={item.name} className="text-center">
              <div className="text-2xl font-bold text-navy-500 dark:text-navy-200">
                {item.winRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                {item.name} | {item.picks} picks
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsOverview;
