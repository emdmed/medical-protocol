import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MinimalistClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // const getTimezone = (date) => {
  //   return date
  //     .toLocaleDateString("en-US", {
  //       timeZoneName: "short",
  //     })
  //     .split(", ")[1];
  // };

  return (
      <div className="flex gap-1 items-baseline text-xs opacity-50">
        <div className="">
          {formatTime(currentTime)}
        </div>
        <div>{formatDate(currentTime)}</div>
      </div>
  );
}
