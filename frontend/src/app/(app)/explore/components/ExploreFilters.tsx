"use client";

import { motion } from "framer-motion";

export type ExploreFiltersState = {
  locations: string[];
  roles: string[];
  experience: string[];
  workplaceType: string[];
};

interface ExploreFiltersProps {
  filters: ExploreFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ExploreFiltersState>>;
  isMobile?: boolean;
}

const INDIAN_CITIES = [
  "Bengaluru", "Hyderabad", "Pune", "Delhi NCR", "Mumbai", "Chennai",
];

const ROLES = [
  "Software Engineering", "Frontend", "Backend", "Full Stack", "Data Science", "DevOps",
];

const WORKPLACE_TYPES = ["Remote", "Hybrid", "On-site"];

export default function ExploreFilters({ filters, setFilters, isMobile = false }: ExploreFiltersProps) {
  
  const toggleFilter = (key: keyof ExploreFiltersState, value: string) => {
    setFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const FilterGroup = ({ title, options, filterKey }: { title: string, options: string[], filterKey: keyof ExploreFiltersState }) => (
    <div className="mb-6">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isActive = filters[filterKey].includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleFilter(filterKey, opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                isActive 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                  : "bg-white/40 border-slate-200/60 text-slate-600 hover:bg-white hover:border-slate-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col ${!isMobile ? "sticky top-[100px]" : ""}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 font-outfit">Filters</h2>
        <button 
          onClick={() => setFilters({ locations: [], roles: [], experience: [], workplaceType: [] })}
          className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <FilterGroup title="Workplace" options={WORKPLACE_TYPES} filterKey="workplaceType" />
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>
        <FilterGroup title="Roles" options={ROLES} filterKey="roles" />
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>
        <FilterGroup title="Top Locations" options={INDIAN_CITIES} filterKey="locations" />
      </div>
    </div>
  );
}
