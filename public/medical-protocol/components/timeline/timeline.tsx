/**
 * Timeline — Scrollable clinical event timeline with duration badges and popovers.
 *
 * @props
 *   items?     — TimelineItem[] (defaults to sample timelineData export)
 *   maxHeight? — CSS max-height for scroll area (default "32rem")
 *
 * @usage
 *   import Timeline, { timelineData } from "@/components/timeline/timeline";
 *   <Timeline items={myEvents} maxHeight="24rem" />
 *
 * @item shape  { label: string, timestamp: number (unix seconds),
 *                title: string, description: string, popoverContent: string }
 *
 * @behavior  Read-only display. Click a date button to see popover details.
 *            Duration badges auto-calculated between consecutive items.
 */
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MedicalDisclaimer } from '@/components/medical-disclaimer';

export interface TimelineItem {
  label: string;
  timestamp: number;
  title: string;
  description: string;
  popoverContent: string;
}

export const timelineData: TimelineItem[] = [
  {
    label: "Day 1",
    timestamp: 1722729600, // Aug 4, 2025
    title: "Admission & Initial Assessment",
    description: "Patient admitted with acute symptoms, vital signs stabilized",
    popoverContent: "Patient John D. (45M) admitted via emergency department presenting with chest pain and dyspnea. Initial vitals: BP 150/95, HR 102, O2 sat 88% on room air. Started on oxygen therapy, IV fluids, and continuous cardiac monitoring. Chest X-ray and ECG completed."
  },
  {
    label: "Day 2",
    timestamp: 1722816000, // Aug 5, 2025
    title: "Treatment Response",
    description: "Positive response to initial treatment, symptoms improving",
    popoverContent: "Patient showing marked improvement overnight. O2 saturation improved to 94% on 2L nasal cannula. Chest pain reduced from 8/10 to 4/10. Laboratory results show elevated troponins confirming myocardial injury. Cardiology consulted. Started on dual antiplatelet therapy and beta-blockers."
  },
  {
    label: "Day 3",
    timestamp: 1722902400, // Aug 6, 2025
    title: "Diagnostic Procedures",
    description: "Cardiac catheterization performed, significant findings identified",
    popoverContent: "Cardiac catheterization revealed 70% occlusion in LAD artery. Successful percutaneous coronary intervention with drug-eluting stent placement. Procedure tolerated well without complications. Post-procedure vitals stable. Patient reports complete resolution of chest pain."
  },
  {
    label: "Day 4",
    timestamp: 1722988800, // Aug 7, 2025
    title: "Post-Procedure Recovery",
    description: "Stable post-intervention, monitoring for complications",
    popoverContent: "Patient remained hemodynamically stable post-catheterization. No signs of bleeding or vascular complications at access site. Ambulating without assistance. Oxygen weaned to room air with O2 sat 96%. Dietary consultation completed for cardiac diet education."
  },
  {
    label: "Day 5",
    timestamp: 1723075200, // Aug 8, 2025
    title: "Rehabilitation Planning",
    description: "Physical therapy initiated, discharge planning begun",
    popoverContent: "Physical therapy assessment completed - patient cleared for progressive activity. Cardiac rehabilitation referral made. Medication reconciliation performed with clinical pharmacist. Patient education on heart-healthy lifestyle modifications provided. Social work consulted for discharge planning."
  },
  {
    label: "Day 6",
    timestamp: 1723161600, // Aug 9, 2025
    title: "Pre-Discharge Assessment",
    description: "Final evaluations completed, patient stable for discharge",
    popoverContent: "All discharge criteria met. Echocardiogram shows improved left ventricular function (EF 50%). Patient demonstrates understanding of medications and follow-up care. Home safety assessment completed. Transportation arrangements confirmed for discharge tomorrow."
  },
  {
    label: "Day 7",
    timestamp: 1723248000, // Aug 10, 2025
    title: "Discharge Planning",
    description: "Patient discharged home with comprehensive follow-up plan",
    popoverContent: "Patient discharged in stable condition with complete medication reconciliation. Follow-up appointments scheduled: cardiology in 1 week, primary care in 3 days. Cardiac rehabilitation enrollment confirmed. Emergency warning signs reviewed with patient and family. Patient verbalized understanding of discharge instructions."
  },
  {
    label: "Day 14",
    timestamp: 1723852800, // Aug 17, 2025
    title: "First Follow-up",
    description: "Post-discharge clinic visit, recovery progressing well",
    popoverContent: "Patient returned for scheduled cardiology follow-up. Reports no chest pain, improved exercise tolerance. Vital signs stable: BP 128/82, HR 78. Wound healing well at catheterization site. Medication adherence confirmed. Cardiac rehabilitation participation excellent - attending 3x weekly sessions."
  },
  {
    label: "Day 30",
    timestamp: 1725235200, // Sep 2, 2025
    title: "Recovery Milestone",
    description: "One-month post-intervention assessment shows excellent progress",
    popoverContent: "Comprehensive 30-day evaluation demonstrates excellent recovery. Patient reports return to normal daily activities with improved energy levels. Stress test shows good functional capacity. All cardiac medications well-tolerated. Weight loss of 8 lbs achieved through dietary modifications. Cleared for gradual return to work activities."
  }
];

interface TimelineProps {
  items?: TimelineItem[];
  maxHeight?: string;
}

const Timeline = ({ items = timelineData, maxHeight = "32rem" }: TimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatDuration = (startTimestamp, endTimestamp) => {
    const diffMs = (endTimestamp - startTimestamp) * 1000;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else if (weeks > 0) {
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      return 'Same day';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -300, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-full p-6">
      <div className="pb-8">
        <div className="relative flex flex-col items-center">
          <Button
            onClick={scrollUp}
            size='icon'
            variant='ghost'
            className="flex-shrink-0 mb-2"
            aria-label="Scroll up"
          >
            <ChevronUp/>
          </Button>
          
          <div 
            ref={scrollContainerRef}
            className="flex flex-col overflow-y-auto scrollbar-hide flex-1 relative items-center justify-start my-2 w-full"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              maxHeight: maxHeight
            }}
          >
            {items.map((item, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                {index > 0 && (
                  <Badge variant="outline" className='rounded-2xl mx-auto py-1'>
                    {formatDuration(items[index - 1]?.timestamp, item?.timestamp)}
                  </Badge>
                )}
                
                <div className="relative flex-shrink-0 py-1 first:pt-0 last:pb-0">
                  <div className="relative flex items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" className="whitespace-nowrap my-2">
                          {formatDate(item.timestamp)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start" side="right">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {item.popoverContent}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              
              </div>
            ))}
          </div>
          
          <Button
            onClick={scrollDown}
            size='icon'
            variant='ghost'
            className="flex-shrink-0 mt-2"
            aria-label="Scroll down"
          >
            <ChevronDown/>
          </Button>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  );
};

export default Timeline;