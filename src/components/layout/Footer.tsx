import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#E5E5E5] bg-[#FFFFFF] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#666666]">
        <div>
          <p className="font-serif-academic font-medium text-sm text-[#1A1A1A]">
            Federal University Lokoja · University Library
          </p>
          <p className="text-[11px] mt-0.5 text-[#666666]">
            Adankolo & Felele Campuses · PMB 1022, Lokoja, Kogi State, Nigeria · Circulation & Academic Repository
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono-ledger text-[11px] text-[#666666]">
          <span>EVM Ledger Node</span>
          <span>·</span>
          <span>Solidity 0.8.24</span>
          <span>·</span>
          <span>Chain ID 31337</span>
        </div>
      </div>
    </footer>
  );
};
