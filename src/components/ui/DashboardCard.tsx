import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export default function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#D6D6D6] border border-gray-300 rounded-xl shadow-md p-8 min-w-[180px] min-h-[140px] mx-auto font-sans" style={{fontFamily: 'Inter, Raleway, Montserrat, sans-serif'}}>
      <div className="mb-3 text-3xl text-[#1D3557]">{icon}</div>
      <div className="text-3xl font-bold text-[#222222] mb-1">{value}</div>
      <div className="text-base font-medium text-[#1D3557] text-center tracking-wide">{title}</div>
    </div>
  );
} 