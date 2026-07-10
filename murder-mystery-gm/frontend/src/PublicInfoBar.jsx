import React from 'react';
import { Skull, MapPin, Clock } from 'lucide-react';

export default function PublicInfoBar({ 
  title, 
  victim, 
  location, 
  round, 
  totalRounds, 
  timeLabel 
}) {
  return (
    <div className="bg-mystery-panel border-b-2 border-mystery-red/80 shadow-lg px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center relative z-20 font-case">
      
      {/* Red Pin Decorative Motif */}
      <div className="absolute top-0 right-1/4 w-3 h-3 rounded-full bg-mystery-red border border-mystery-brass shadow-md z-0 hidden md:block shadow-black/50 transform -translate-y-1/2"></div>
      <div className="absolute top-0 right-1/4 w-0.5 h-full bg-mystery-red/60 -rotate-6 z-0 hidden md:block origin-top"></div>

      <div className="relative z-10 w-full mb-4 md:mb-0">
        <h1 className="text-3xl font-typewriter tracking-widest uppercase text-mystery-brass mb-3 line-clamp-1">
          {title || "Active Case File"}
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
          <div className="flex items-start space-x-2">
            <Skull className="w-5 h-5 text-mystery-red shrink-0 mt-0.5" />
            <div>
              <span className="text-xs uppercase font-typewriter text-mystery-textSecondary block">Victim</span>
              <span className="text-mystery-text font-semibold">{victim}</span>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="w-5 h-5 text-mystery-textSecondary shrink-0 mt-0.5" />
            <div>
              <span className="text-xs uppercase font-typewriter text-mystery-textSecondary block">Location</span>
              <span className="text-mystery-text font-semibold line-clamp-1">{location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex space-x-6 border-t md:border-t-0 md:border-l border-[#3a332a] pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0 justify-between md:justify-end">
        {round && (
          <div className="text-center md:text-right">
            <span className="text-xs uppercase font-typewriter text-mystery-textSecondary block mb-1">Phase</span>
            <span className="text-mystery-brass font-bold text-lg">{round}{totalRounds ? ` / ${totalRounds}` : ''}</span>
          </div>
        )}
        
        {timeLabel && (
          <div className="text-center md:text-right flex flex-col items-center md:items-end">
            <span className="text-xs uppercase font-typewriter text-mystery-textSecondary block mb-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Time</span>
            </span>
            <span className="text-mystery-red font-bold text-lg animate-pulse motion-reduce:animate-none">
              {timeLabel}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
