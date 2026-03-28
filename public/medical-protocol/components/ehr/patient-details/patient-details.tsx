import { ArrowUpLeftFromCircleIcon, FilePlus, RotateCwSquare, Save, Scroll } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VitalSigns from "@/components/vital-signs/vital-signs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import PrevEvolutions from "../prev-evolutions/prev-evolutions";

export const PatientDetails = ({ currentRecord, isSaved, analysis, createNewRecord, allRecords }) => {
  const [vitalSignsData, setVitalSignsData] = useState(null)
  
  useEffect(() => {
    const parsedAnalysis = analysis ? JSON.parse(analysis) : null;
    const extractedVitalSigns =
      parsedAnalysis?.physical_exam?.vital_signs || null;
    
    setVitalSignsData(extractedVitalSigns)
  }, [analysis])

    
  return (
    <div className="flex gap-6 items-center justify-between w-full">
      <div className="flex items-baseline gap-2">
        <span>{currentRecord.patientName}</span>
        <small className="opacity-50">52 años</small>
        <Badge variant="outline"  className="opacity-50">Privado</Badge>
      </div>      
      {isSaved && (
        <Badge>
          <Save /> Guardado!
        </Badge>
      )}
      {analysis && <VitalSigns
        assistant={false}
        border={false}
        data={vitalSignsData || null}
      />}
    </div>
  );
};