import React from 'react';
import { Search } from 'lucide-react';

export default function LoadingMystery({ 
  label = "The Game Master is crafting your mystery...", 
  hint = "This may take a moment." 
}) {
  return (
    <div className="min-h-screen bg-mystery-bg flex flex-col items-center justify-center p-6 text-center">
      <Search className="w-16 h-16 text-mystery-red mb-8 animate-pulse motion-reduce:animate-none" />
      <h2 className="text-3xl md:text-4xl font-typewriter text-mystery-text mb-4">
        {label}
      </h2>
      <p className="text-mystery-textSecondary font-case italic text-lg">
        {hint}
      </p>
    </div>
  );
}
