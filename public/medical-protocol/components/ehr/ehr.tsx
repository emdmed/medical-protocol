"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea-inv";
import { Input } from "@/components/ui/input";
import defaultRecords from "./utils/defaultRecords";
import { ArrowUpLeftFromCircleIcon, FilePlus, RotateCwSquare, Scroll, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MedicalRecordsSidebar } from "./sidebar/sidebar";
import { Save, Trash2, Wrench, Loader2 } from "lucide-react";
import { PatientDetails } from "./patient-details/patient-details";
import MinimalistClock from "./clock/clock";
import WaterBalanceCalculator from "@/components/water-balance/water-balance";
import AcidBaseWidget from "@/components/acid-base/acid-base";
import BMICalculator from "@/components/bmi/bmi-calculator";
import { generateHighlightedHTML } from "./utils/generateHighlightedHTML";
import References from "./references/references";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PrevEvolutions from "./prev-evolutions/prev-evolutions";

// Define types for better type safety
interface AnalysisData {
  analysis: string;
  [key: string]: any; // Allow for other properties
}

interface MedicalRecord {
  id: number;
  patientName: string;
  patientAge: string;
  date: string;
  notes: string;
  diagnosis: string;
  treatment: string;
  analysis?: AnalysisData | null; // Make optional with ?
  timestamp?: string;
}

interface EhrUser {
  name?: string;
  surname?: string;
  specialty?: string;
  idNumber?: string;
}

interface Tool {
  value: string;
  label: string;
}

export default function MedicalRecordsApp() {
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord>({
    id: new Date().getTime(),
    patientName: "Jose Garcia",
    patientAge: "52",
    date: new Date().toISOString().split("T")[0],
    notes: ``,
    diagnosis: "",
    treatment: "",
    analysis: null // Changed from empty string to null
  });

  const [allRecords, setAllRecords] = useState<MedicalRecord[]>([]);
  const [isViewingExistingRecord, setIsViewingExistingRecord] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [user, setUser] = useState<EhrUser | null>(null)

  useEffect(() => {
    try{
      const storedString = localStorage.getItem("ehr-user")
      if (storedString) {
        setUser(JSON.parse(storedString) as EhrUser)
      }
    } catch(err){
      console.error(err)
    }

  }, [])
  
  
  const handleCreateNewRecord = () => {
    createNewRecord();
  };

  // Available tools list
  const [availableTools, setAvailableTools] = useState<Tool[]>([
    { value: "balance-hidrico", label: "Balance hídrico" },
    { value: "eab", label: "EAB" },
    { value: "bmi", label: "BMI" },
  ]);

  useEffect(() => {
    if (!isSaved) return;
    const timer = setTimeout(() => {
      setIsSaved(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isSaved]);

  // Reset copied state after showing feedback
  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isCopied]);

  // Selected tools for the current record
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Fixed useEffect for loading records
  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounts

    try {
      const savedRecords = localStorage.getItem("medicalRecords");

      if (
        savedRecords &&
        savedRecords !== "undefined" &&
        savedRecords !== "null"
      ) {
        try {
          const parsedRecords = JSON.parse(savedRecords);
          if (Array.isArray(parsedRecords) && mounted) {
            console.log(
              "Loaded records from localStorage:",
              parsedRecords.length,
            );
            setAllRecords(parsedRecords);
            return;
          }
        } catch (parseError) {
          console.warn("Error parsing saved records:", parseError);
          localStorage.removeItem("medicalRecords"); // Clear corrupt data
        }
      }

      // Only set defaults if no valid records found
      if (mounted) {
        console.log("Setting default records");
        setAllRecords(defaultRecords);
        localStorage.setItem("medicalRecords", JSON.stringify(defaultRecords));
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
      if (mounted) {
        setAllRecords(defaultRecords);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Filter records to show only those for the current patient
  const currentPatientRecords = allRecords.filter(
    (record) => record.patientName === currentRecord.patientName,
  );

  // Fixed updateRecordWithAnalysis function
  const updateRecordWithAnalysis = (recordId: number, analysisData: AnalysisData) => {
    setAllRecords((prevRecords) => {
      const updatedRecords = prevRecords.map((record) =>
        record.id === recordId ? { ...record, analysis: analysisData } : record,
      );

      // Save to localStorage with the updated records
      try {
        localStorage.setItem("medicalRecords", JSON.stringify(updatedRecords));
        console.log("Updated record with analysis, saved to localStorage");
      } catch (error) {
        console.warn("localStorage not available:", error);
      }

      return updatedRecords;
    });

    // Update currentRecord if it matches
    if (currentRecord?.id === recordId) {
      setCurrentRecord((prev) => ({
        ...prev,
        analysis: analysisData.response,
      }));
    }
  };

  // Function to copy note to clipboard
  const copyNoteToClipboard = async () => {
    try {
      // Create the complete note text with patient information
      const noteHeader = `Paciente: ${currentRecord.patientName}\nEdad: ${currentRecord.patientAge} años\nFecha: ${currentRecord.date}\n\n`;
      const noteContent = currentRecord.notes.trim();
      const fullNote = noteHeader + noteContent;
      
      // Add doctor signature if available
      if (user?.name && user?.surname) {
        const signature = `\n\n---\nDr. ${user.surname} ${user.name}\n${user.specialty || ''}\nM.N. ${user.idNumber || ''}`;
        const completeNote = fullNote + signature;

        await navigator.clipboard.writeText(completeNote);
      } else {
        await navigator.clipboard.writeText(fullNote);
      }
      
      setIsCopied(true);
      console.log("Note copied to clipboard successfully");
    } catch (error) {
      console.error("Failed to copy note to clipboard:", error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        const noteHeader = `Paciente: ${currentRecord.patientName}\nEdad: ${currentRecord.patientAge} años\nFecha: ${currentRecord.date}\n\n`;
        const noteContent = currentRecord.notes.trim();
        let fullNote = noteHeader + noteContent;
        
        if (user?.name && user?.surname) {
          const signature = `\n\n---\nDr. ${user.surname} ${user.name}\n${user.specialty || ''}\nM.N. ${user.idNumber || ''}`;
          fullNote += signature;
        }
        
        textArea.value = fullNote;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsCopied(true);
      } catch (fallbackError) {
        console.error("Fallback copy method also failed:", fallbackError);
      }
    }
  };

  // Function to call EHR Analysis API
  const analyzeNote = async (noteText: string, recordId: number): Promise<AnalysisData | null> => {
    try {
      setIsAnalyzing(true);
      console.log("🚀 Calling EHR Analysis API...");
  
      const response = await fetch("/api/ehrAnalysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: noteText.trim(),
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${errorData.error || response.statusText}`,
        );
      }
  
      const result: AnalysisData = await response.json();
      console.log("📊 EHR Analysis Result:", result);
  
      // Log the analysis content separately for easier reading
      if (result.response) {
        console.log("📝 Analysis Content:", result.analysis);
      }
  

      if (result && recordId) {
        updateRecordWithAnalysis(recordId, result?.analysis);
        
        // IMPORTANT: Update the current record state immediately to trigger re-render
        // This will cause the component to switch from Textarea to HTML view
        setCurrentRecord((prev) => ({
          ...prev,
          analysis: result?.analysis,
        }));
        
        console.log("✅ Record updated with complete analysis object:", result);
      }
  
      return result;
    } catch (error) {
      console.error("❌ Error calling EHR Analysis API:", error);
      // Don't throw the error - just log it so the save process continues
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fixed saveRecord function
  const saveRecord = async () => {
    if (currentRecord.patientName.trim() && currentRecord.notes.trim()) {
      const recordId = Date.now();
      const newRecord: MedicalRecord = {
        id: recordId,
        ...currentRecord,
        timestamp: "Just now",
      };

      // Update state first
      setAllRecords((prevRecords) => {
        const updatedRecords = [newRecord, ...prevRecords];

        // Save to localStorage immediately with the updated records
        try {
          localStorage.setItem(
            "medicalRecords",
            JSON.stringify(updatedRecords),
          );
          console.log(
            "Saved record to localStorage:",
            updatedRecords.length,
            "records",
          );
        } catch (error) {
          console.warn("localStorage not available:", error);
        }

        return updatedRecords;
      });

      // Update currentRecord with the new ID
      setCurrentRecord((prev) => ({
        ...prev,
        id: recordId,
      }));

      setIsSaved(true);
      setIsViewingExistingRecord(true); // Mark as saved record (read-only)

      // Then analyze the note in the background and update the stored data
      await analyzeNote(currentRecord.notes, recordId);
    }
  };

  const clearForm = () => {
    setCurrentRecord({
      id: new Date().getTime(),
      patientName: currentRecord.patientName, // Keep the same patient
      patientAge: currentRecord.patientAge, // Keep the same patient age
      date: new Date().toISOString().split("T")[0],
      notes: "",
      diagnosis: "",
      treatment: "",
      analysis: null // Changed from empty string to null
    });
    setIsViewingExistingRecord(false); // Enable editing for new record
    // Reset available tools when creating a new record
    setAvailableTools([
      { value: "balance-hidrico", label: "Balance hídrico" },
      { value: "eab", label: "EAB" },
      { value: "bmi", label: "BMI" },
    ]);
    setSelectedTools([]);
  };

  const loadRecord = (record: MedicalRecord) => {
    setCurrentRecord({
      id: record.id, // Make sure to include the ID
      patientName: record.patientName,
      patientAge: record.patientAge,
      date: record.date,
      notes: record.notes,
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      analysis: record.analysis || null, // Load analysis data if available
    });
    setIsViewingExistingRecord(true); // Mark as existing record (read-only)
    // Reset tools when loading a different record
    setAvailableTools([
      { value: "balance-hidrico", label: "Balance hídrico" },
      { value: "eab", label: "EAB" },
      { value: "bmi", label: "BMI" },
    ]);
    setSelectedTools([]);
  };

  const createNewRecord = () => {
    clearForm();
  };

  // Global keyboard shortcuts using useEffect with document event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl + Enter for saving (only when not viewing existing record)
      if (
        e.ctrlKey &&
        e.key === "Enter" &&
        !isViewingExistingRecord &&
        !isAnalyzing
      ) {
        e.preventDefault();
        const isFormValid =
          currentRecord.patientName.trim() && currentRecord.notes.trim();
        if (isFormValid) {
          saveRecord();
        }
      }

      // Handle Ctrl + N for new record
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        createNewRecord();
      }

      // Handle Ctrl + C for copying note (only when there's content)
      if (e.ctrlKey && e.key === "c" && e.shiftKey && currentRecord.notes.trim()) {
        e.preventDefault();
        copyNoteToClipboard();
      }

      // Alternative: Alt + Enter for new record (as mentioned in your original code)
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        createNewRecord();
      }
    };

    // Add event listener to document so it works globally
    document.addEventListener("keydown", handleGlobalKeyDown);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [currentRecord, isViewingExistingRecord, allRecords, isAnalyzing, user]); // Dependencies for the functions used inside

  const handleToolSelect = (value: string) => {
   // if (isViewingExistingRecord) return;

    console.log("Selected tool:", value);

    setSelectedTools((prev) => [...prev, value]);

    setAvailableTools((prev) => prev.filter((tool) => tool.value !== value));
  };

  const isFormValid =
    currentRecord.patientName.trim() && currentRecord.notes.trim();
  

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex flex-col w-full h-screen grid-pattern-ehr">
        <div className="flex opacity-75 gap-3 p-2 rounded m-3 justify-between">
        </div>
        <div className="flex w-full py-4 px-8 flex-1">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-4 p-2 border-b justify-between">
              <div className="flex-1">
                <MinimalistClock />
                <PatientDetails
                  currentRecord={currentRecord}
                  isSaved={isSaved}
                  analysis={currentRecord?.analysis?.analysis}
                  createNewRecord={createNewRecord}
                  allRecords={allRecords}
                />  
              </div>
              
              {/* Copy to Clipboard Button */}
              {currentRecord.notes.trim() && (
                <Button
                  onClick={copyNoteToClipboard}
                  variant="ghost"
                  size="icon"
                  className="relative"
                  title="Copiar nota completa (Ctrl+Shift+C)"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="ms-2" variant="ghost" size="icon">
                    <FilePlus/>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Crear Nueva Evolución</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas crear una nueva evolución para {currentRecord.patientName}? 
                      Se guardará el progreso actual y se iniciará un nuevo registro.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateNewRecord}>
                      Crear Nueva Evolución
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <PrevEvolutions allRecords={allRecords} />
              
              <SidebarTrigger />
            </div>
            <div className="flex-1 flex flex-col gap-4 p-4">
              <div className="flex flex-1">
                {/* Conditional rendering: HTML analysis view or Textarea */}
                <div className="relative flex-1">
                  {/* Loading overlay while analyzing */}
                  {isAnalyzing && (
                    <div className="absolute inset-0  backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm font-medium">
                          Guardando nota médica...
                        </p>
                        <p className="text-xs text-gray-500">
                          Por favor espera mientras procesamos el contenido
                        </p>
                      </div>
                    </div>
                  )}

                  {currentRecord.analysis ? (
                    <div
                      className="w-[75%]"
                      style={{ fontFamily: "sans-serif", maxHeight: "500px" }}
                      dangerouslySetInnerHTML={{
                        __html: generateHighlightedHTML(
                          currentRecord.notes,
                          typeof currentRecord.analysis === 'string'
                            ? JSON.parse(currentRecord.analysis)
                            : currentRecord.analysis,
                        ),
                      }}
                    />
                  ) : (
                    <Textarea
                      placeholder={
                        isViewingExistingRecord
                          ? "Registro guardado - Solo lectura"
                          : `Comenzá la historia clínica de ${currentRecord.patientName} acá...`
                      }
                      value={currentRecord.notes}
                      onChange={(e) =>
                        !isViewingExistingRecord &&
                        setCurrentRecord({
                          ...currentRecord,
                          notes: e.target.value,
                        })
                      }
                      className={`flex-1 resize-none w-[75%] ${
                        isViewingExistingRecord
                          ? "cursor-not-allowed opacity-75"
                          : ""
                      }`}
                      readOnly={isViewingExistingRecord}
                    />
                    
                  )}
                  <div className="flex flex-col absolute bottom-0 px-3 py-2 opacity-50">
                    <span>{user?.surname} {user?.name}</span>
                    <small>{user?.specialty}</small>
                    <small>M.N.{user?.idNumber}</small>
                  </div>
                </div>

                <div className="w-[35%] pl-6">
                  {/* Rest of your tools section remains the same */}
                  <div className="flex gap-2 items-end justify-end flex-col">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      <Select
                        onValueChange={handleToolSelect}
                        key={availableTools.length}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder="Agregar"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTools.map((tool) => (
                            <SelectItem key={tool.value} value={tool.value}>
                              {tool.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="py-4 flex flex-col gap-4 items-end">
                      {selectedTools.includes("balance-hidrico") && (
                        <div className="flex gap-2">
                          <WaterBalanceCalculator data={{}} />
                          {!isViewingExistingRecord && (
                            <Button
                              onClick={() => {
                                setSelectedTools(
                                  selectedTools.filter(
                                    (tool) => tool !== "balance-hidrico",
                                  ),
                                );
                                setAvailableTools((prev) => [
                                  ...prev,
                                  {
                                    value: "balance-hidrico",
                                    label: "Balance hídrico",
                                  },
                                ]);
                              }}
                              variant="ghost"
                              className="h-6 w-6"
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      )}
                      {selectedTools.includes("eab") && (
                        <div className="flex gap-2">
                          <AcidBaseWidget />
                          {!isViewingExistingRecord && (
                            <Button
                              onClick={() => {
                                setSelectedTools(
                                  selectedTools.filter(
                                    (tool) => tool !== "eab",
                                  ),
                                );
                                setAvailableTools((prev) => [
                                  ...prev,
                                  { value: "eab", label: "EAB" },
                                ]);
                              }}
                              variant="ghost"
                              className="h-6 w-6"
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      )}
                      {selectedTools.includes("bmi") && (
                        <div className="flex gap-2">
                          <BMICalculator />
                          {!isViewingExistingRecord && (
                            <Button
                              onClick={() => {
                                setSelectedTools(
                                  selectedTools.filter(
                                    (tool) => tool !== "bmi",
                                  ),
                                );

                                setAvailableTools((prev) => [
                                  ...prev,
                                  { value: "bmi", label: "BMI" },
                                ]);
                              }}
                              variant="ghost"
                              className="h-6 w-6"
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
 
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 p-2">
          {currentRecord.analysis && <References />}
        </div>
      </div>

      <MedicalRecordsSidebar
        records={currentPatientRecords}
        onLoadRecord={loadRecord}
      />
    </SidebarProvider>
  );
}