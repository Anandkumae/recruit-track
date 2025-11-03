'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { candidates } from '@/lib/data';
import type { HiringStage } from '@/lib/types';

const stageOrder: HiringStage[] = ['Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'];

const getHiringStageData = () => {
    const stageCounts = candidates.reduce((acc, candidate) => {
        acc[candidate.status] = (acc[candidate.status] || 0) + 1;
        return acc;
    }, {} as Record<HiringStage, number>);

    return stageOrder.map(stage => ({
        name: stage,
        total: stageCounts[stage] || 0,
    }));
};


export function OverviewChart() {
    const data = getHiringStageData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Pipeline</CardTitle>
        <CardDescription>
          Number of candidates in each hiring stage.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
