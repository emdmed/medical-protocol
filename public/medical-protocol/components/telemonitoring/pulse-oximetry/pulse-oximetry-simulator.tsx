import { useState, useEffect, useRef } from "react"
import PulseOximetry from "./pulse-oximetry"

const PulseOximetrySimulator = ({ minBpm, maxBpm, minSpo2, maxSpo2 }) => {
  const [currentBpm, setCurrentBpm] = useState(105)
  const [currentSpo2, setCurrentSpo2] = useState(95)
  const [isBeating, setIsBeating] = useState(false)
  const bpmRef = useRef(105)

  useEffect(() => {
    const bpmUpdateInterval = setInterval(() => {
      setCurrentBpm(prev => {
        const change = (Math.random() - 0.5) * 1
        const newBpm = prev + change
        const boundedBpm = Math.max(minBpm, Math.min(maxBpm, newBpm))
        bpmRef.current = boundedBpm
        return boundedBpm
      })
    }, 3000)

    return () => clearInterval(bpmUpdateInterval)
  }, [])

  useEffect(() => {
    const spo2UpdateInterval = setInterval(() => {
      setCurrentSpo2(prev => {
        const change = (Math.random() - 0.5) * 1.75
        const newSpo2 = prev + change
        return Math.max(minSpo2, Math.min(maxSpo2, newSpo2))
      })
    }, 4000)

    return () => clearInterval(spo2UpdateInterval)
  }, [])

  useEffect(() => {
    let lastBeatTime = Date.now()

    const checkBeat = () => {
      const now = Date.now()
      const timeSinceLastBeat = now - lastBeatTime
      const interval = 60000 / bpmRef.current

      if (timeSinceLastBeat >= interval) {
        setIsBeating(true)
        setTimeout(() => setIsBeating(false), 150)
        lastBeatTime = now
      }
    }

    const checkInterval = setInterval(checkBeat, 50)

    return () => clearInterval(checkInterval)
  }, [])

  return <PulseOximetry bpm={currentBpm} spo2={currentSpo2} isBeating={isBeating} />
}

export default PulseOximetrySimulator
