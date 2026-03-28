import { Activity } from "lucide-react"
import { useState } from "react"

const PulseOximetry = ({ bpm, spo2, isBeating }) => {

  const [isMessageVisible, setIsMessageVisible] = useState(false)
  const isWarning = bpm >= 100 && bpm < 145
  const isDanger = bpm >= 145

  const getIconScale = () => {

    if (isWarning) return "scale-140"
    if (isDanger) return "scale-150"

    return "scale-125"
  }

  const iconScale = getIconScale()

  return (
    <div className="flex items-center gap-2 border rounded-xl shadow px-2 py-1">
      <div className="flex gap-1 items-baseline">
        <span className="text-xl font-bold">{Math.round(spo2)}</span>
        <span className="text-sm">%</span>
      </div>
      <Activity
        size={15}
        className={`transition-all ${isBeating
          ? `duration-75 ease-out ${iconScale} opacity-100`
          : 'duration-300 ease-in scale-100 opacity-30'
          } ${isBeating
            ? isDanger
              ? 'text-red-500'
              : isWarning
                ? 'text-orange-400'
                : 'text-emerald-500'
            : 'text-gray-600'
          }`}
      />
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold ${isWarning && "text-orange-400"} ${isDanger && "text-red-500"}`}>
          {Math.round(bpm)}
        </span>
        <span className={`text-sm ${isWarning && "text-orange-400"} ${isDanger && "text-red-500"}`}>bpm</span>
      </div>
    </div>
  )
}

export default PulseOximetry
