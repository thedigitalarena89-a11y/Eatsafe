import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = ''; // Use relative path for Vercel Serverless Functions

export default function ScanPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
    }
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError('');
    setCameraReady(false);
    if (!cameraSupported) {
      setError('Camera is not supported on this device or browser.');
      return;
    }
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
          setCameraReady(true);
        };
      }
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImageFile(file);
      setImageUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleProcess = async () => {
    if (!imageFile) return;
    setProcessing(true);
    setError('');
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Processing failed');
      }
      navigate('/result', { state: { result: data, imageUrl } });
    } catch (err) {
      setError(`AI Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--on-background)'
    }}>
      {/* Header — glass over dark */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'linear-gradient(to bottom, rgba(26,28,31,0.7), transparent)',
        zIndex: 50,
        color: 'white'
      }}>
        <button onClick={() => navigate('/home')} style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer'
        }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-headline" style={{ fontSize: '1rem' }}>Scan Food</span>
        <button style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer'
        }}>
          <span className="material-symbols-outlined">flash_on</span>
        </button>
      </header>

      {/* Camera Viewport */}
      <main style={{ height: '100vh', width: '100%', position: 'relative' }}>
        <div style={{ height: '100%', width: '100%', position: 'relative', background: '#000' }}>
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            autoPlay 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none' 
            }} 
          />
          {!cameraActive && imageUrl && (
            <img src={imageUrl} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {!cameraActive && !imageUrl && (
            <div style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 48px'
            }}>
              <div style={{ color: 'white' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '20px', opacity: 0.2, display: 'block' }}>photo_camera</span>
                <p style={{ opacity: 0.5, fontSize: '0.875rem', marginBottom: '24px' }}>Camera inactive. Start camera or upload an image.</p>
                <button className="btn-primary" onClick={startCamera} style={{ maxWidth: '240px', margin: '0 auto' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>videocam</span>
                  Start Camera
                </button>
              </div>
            </div>
          )}

          {/* Scanner Overlay */}
          {(cameraActive || imageUrl) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ position: 'relative', width: '260px', height: '260px' }}>
                {/* Shadow mask */}
                <div style={{ position: 'absolute', inset: -2000, boxShadow: '0 0 0 2000px rgba(26, 28, 31, 0.65)', pointerEvents: 'none' }} />

                {/* Corner brackets */}
                {[
                  { top: -2, left: -2, borderTop: '3px solid var(--primary-container)', borderLeft: '3px solid var(--primary-container)', borderRadius: '12px 0 0 0' },
                  { top: -2, right: -2, borderTop: '3px solid var(--primary-container)', borderRight: '3px solid var(--primary-container)', borderRadius: '0 12px 0 0' },
                  { bottom: -2, left: -2, borderBottom: '3px solid var(--primary-container)', borderLeft: '3px solid var(--primary-container)', borderRadius: '0 0 0 12px' },
                  { bottom: -2, right: -2, borderBottom: '3px solid var(--primary-container)', borderRight: '3px solid var(--primary-container)', borderRadius: '0 0 12px 0' }
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: '28px', height: '28px', ...s }} />
                ))}

                {/* Scan frame ghost border */}
                <div className="ghost-border" style={{ position: 'absolute', inset: 0, borderRadius: '32px' }} />
              </div>

              <div className="glass-hero" style={{
                marginTop: '28px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>center_focus_strong</span>
                <p style={{ color: 'var(--on-surface-variant)', fontWeight: '600', fontSize: '0.8rem' }}>Align food within the frame</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: '64px 32px 40px',
          background: 'linear-gradient(to top, rgba(26,28,31,0.9), rgba(26,28,31,0.4), transparent)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px'
        }}>
          {/* Status Chips */}
          <div className="flex gap-2">
            <div className="selection-chip active" style={{ minHeight: 'auto', padding: '8px 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restaurant</span>
              <span>Detecting...</span>
            </div>
            <div className="selection-chip" style={{
              minHeight: 'auto',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>scale</span>
              <span>Calibrate</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between w-full" style={{ maxWidth: '340px' }}>
            {/* Upload */}
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>image</span>
              </div>
              <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>UPLOAD</span>
            </label>

            {/* Center Action */}
            {cameraActive ? (
              <button onClick={captureImage} style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: -6,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '50%'
                }} />
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'var(--surface-container-high)' }} />
                </div>
              </button>
            ) : imageUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="btn-primary"
                style={{
                  width: 'auto',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {processing ? 'sync' : 'auto_awesome'}
                </span>
                <span>{processing ? 'Analyzing...' : 'Identify Food'}</span>
              </button>
            ) : (
              <button onClick={startCamera} style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-ambient)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>videocam</span>
              </button>
            )}

            {/* History */}
            <button onClick={() => navigate('/data')} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>history</span>
              </div>
              <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>RECENT</span>
            </button>
          </div>
        </div>
      </main>

      {/* Error toast */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          right: '24px',
          backgroundColor: 'var(--tertiary-container)',
          color: 'var(--on-primary-container)',
          padding: '14px 20px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-ambient)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
