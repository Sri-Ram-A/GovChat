"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

export default function Page() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        toast.success("Location retrieved successfully!");
      },
      (error) => {
        setLoading(false);
        toast.error(`Error: ${error.message}`);
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Get Your Location</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={getLocation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Getting Location..." : "Get Location"}
          </Button>

          {location && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Latitude:</span> {location.latitude}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Longitude:</span> {location.longitude}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}