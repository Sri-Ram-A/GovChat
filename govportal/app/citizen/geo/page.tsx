"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { REQUEST } from "@/services/api";

interface LocationData {
  latitude: number;
  longitude: number;
  display_name?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
  jurisdiction?: {
    NAME?: string;
    CODE?: string;
    LOCATION?: string;
  };
}

export default function Page() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const response = await REQUEST("POST", "admins/geo/", {
            latitude: lat,
            longitude: lng,
          });

          setLocation({
            latitude: Number(response.lat) || lat,
            longitude: Number(response.lon) || lng,
            display_name: response.display_name,
            address: response.address,
            jurisdiction: response.jurisdiction,
          });

          toast.success("Location retrieved successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to send location to backend");
          
          // Still set basic location data even if backend fails
          setLocation({
            latitude: lat,
            longitude: lng,
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast.error(`Error: ${error.message}`);
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-lg">
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
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Latitude:</span> {location.latitude.toFixed(6)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Longitude:</span> {location.longitude.toFixed(6)}
                </p>
              </div>

              {location.display_name && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Location:</p>
                  <p className="text-sm text-blue-800">{location.display_name}</p>
                </div>
              )}

              {location.jurisdiction && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Jurisdiction Details:</p>
                  <div className="space-y-1">
                    {location.jurisdiction.NAME && (
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Name:</span> {location.jurisdiction.NAME}
                      </p>
                    )}
                    {location.jurisdiction.CODE && (
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Code:</span> {location.jurisdiction.CODE}
                      </p>
                    )}
                    {location.jurisdiction.LOCATION && (
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Location:</span> {location.jurisdiction.LOCATION}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {location.address && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2">Address Details:</p>
                  <div className="space-y-1">
                    {location.address.road && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Road:</span> {location.address.road}
                      </p>
                    )}
                    {location.address.suburb && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Suburb:</span> {location.address.suburb}
                      </p>
                    )}
                    {location.address.city && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">City:</span> {location.address.city}
                      </p>
                    )}
                    {location.address.state && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">State:</span> {location.address.state}
                      </p>
                    )}
                    {location.address.postcode && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Postcode:</span> {location.address.postcode}
                      </p>
                    )}
                    {location.address.country && (
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Country:</span> {location.address.country}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}