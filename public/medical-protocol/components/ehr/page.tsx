'use client'

import MedicalRecordsApp from "./ehr"
import Onboarding from "./onboarding/page"

import { useState, useEffect } from "react"

const MainEhr = () => {
  
  const [user, setUser] = useState("")
  const [loading, setLoading] = useState(true)
  
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("ehr-user")
      setUser(JSON.parse(storedUser))
    } catch(err){
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])
  
  
  if(loading) return <div><span>Loading...</span></div>
  
  return <div>
    {user ? <MedicalRecordsApp/> : <Onboarding/> }
  </div>
}

export default MainEhr