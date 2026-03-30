"use client";

import { useState } from "react";
import { toast } from "sonner";
import { REQUEST } from "@/services/api";
import LightRays from '@/components/background/LightRays';
import ElectricBorder from '@/components/ElectricBorder';
import GlassCard from '@/components/background/GlassCard';
import Badge from '@/components/background/Badge';
import InfoBox from '@/components/background/InfoBox';
import LaserFlow from '@/components/LaserFlow';

interface LocationData {
  latitude: number;
  longitude: number;
  display_name?: string;
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
          const response = await REQUEST("POST", "admins/geo/", { latitude: lat, longitude: lng });
          setLocation({
            latitude: Number(response.lat) || lat,
            longitude: Number(response.lon) || lng,
            display_name: response.display_name,
          });
          toast.success("Location retrieved successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to send location to backend");
          setLocation({ latitude: lat, longitude: lng });
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
    <div style={{ minHeight: '100vh', position: 'relative', background: '#0a0a1a' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', zIndex: 2, pointerEvents: 'none' }}>
        <LightRays raysColor="#6600ff" raysSpeed={1} />
      </div>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', overflow: 'hidden', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
            <LaserFlow horizontalBeamOffset={0.5} verticalBeamOffset={0.1} color="#6600ff" />
          </div>
     
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '100vh', position: 'relative', zIndex: 10, gap: '40px' }}>
        
        <div style={{ position: 'relative' }}>

          <ElectricBorder color="#4169E1" speed={0.8} chaos={0.02} borderRadius={24}>
            <GlassCard variant="solid">
              <Badge>FEATURED</Badge>
              <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: 'white', margin: '24px 0 20px', lineHeight: '1.2' }}>
                Location Finder
              </h2>
              <p style={{ color: '#a0a0b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '24px' }}>
                Discover your precise coordinates and location details with a single click.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', marginBottom: '120px' }}>
                <Badge variant="pill">Live</Badge>
                <Badge variant="pill">v1.0</Badge>
              </div>
              <button onClick={getLocation} disabled={loading} style={{ width: '100%', padding: '16px', background: 'white', color: '#1a1a2e', fontSize: '16px', fontWeight: '600', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? "Getting Location..." : "Get Started"}
              </button>
            </GlassCard>
          </ElectricBorder>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '200px', overflow: 'hidden', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
            <LaserFlow horizontalBeamOffset={0.2} verticalBeamOffset={0.05} color="#4169E1" />
          </div>
          <ElectricBorder color="#4169E1" speed={0.8} chaos={0.02} borderRadius={24}>
            <GlassCard variant="transparent">
              {!location ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7bff" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <p style={{ color: '#8a8aa8', textAlign: 'center', fontSize: '16px', lineHeight: '1.5' }}>
                    Click "Get Started" to view your location details
                  </p>
                </div>
              ) : (
                <div>
                  <Badge>RESULTS</Badge>
                  <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '16px 0 28px', lineHeight: '1.2' }}>
                    Your Location
                  </h3>
                  <InfoBox variant="primary">
                    <p style={{ fontSize: '14px', color: '#b0b0c8', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#e0e0f0' }}>Latitude:</span> {location.latitude.toFixed(6)}
                    </p>
                    <p style={{ fontSize: '14px', color: '#b0b0c8' }}>
                      <span style={{ fontWeight: '600', color: '#e0e0f0' }}>Longitude:</span> {location.longitude.toFixed(6)}
                    </p>
                  </InfoBox>
                  {location.display_name && (
                    <InfoBox variant="secondary">
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#9db4ff5e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Location
                      </p>
                      <p style={{ fontSize: '15px', color: '#d0d8ff', lineHeight: '1.5' }}>
                        {location.display_name}
                      </p>
                    </InfoBox>
                  )}
                </div>
              )}
            </GlassCard>
          </ElectricBorder>
        </div>

      </div>
    </div>
  );
}