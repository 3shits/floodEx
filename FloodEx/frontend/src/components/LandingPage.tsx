import React, { useState } from "react";
import {
  Droplets,
  BarChart3,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Play,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";

interface LandingPageProps {
  onLogin: (userData: {
    name: string;
    location: string;
    lat: number;
    lng: number;
  }) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const trainModel = async () => {
    const url = "http://127.0.0.1:8000/train-location";

    // Data to send
    const payload = {
      latitude: coordinates?.lat,
      longitude: coordinates?.lng,
    };

    // Make the POST request using fetch
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("Error calling /predict:", error);
      });
  };

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    location: "",
  });
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ lat, lng });

        // Reverse geocoding to get address
        try {
          // Using a mock reverse geocoding for demo purposes
          // In production, you'd use Google Maps API or similar service
          const mockAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setFormData({ ...formData, location: mockAddress });
        } catch (error) {
          console.error("Error getting address:", error);
          setFormData({
            ...formData,
            location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to detect location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        alert(errorMessage);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password || !formData.location) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    // Use detected coordinates or simulate them
    setTimeout(() => {
      const finalCoordinates = coordinates || {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.209 + (Math.random() - 0.5) * 0.1,
      };

      onLogin({
        name: formData.name,
        location: formData.location,
        ...finalCoordinates,
      });
      setIsLoading(false);
    }, 2000);
  };

  const features = [
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Live Rainfall & Water Level Monitoring",
      description:
        "Real-time data from weather stations and sensors across your region",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Interactive Dashboard with Charts",
      description: "Visual analytics and trends to understand flood patterns",
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Automatic Flood Alerts",
      description:
        "Instant notifications when flood risk exceeds safe thresholds",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Location-based Predictions",
      description: "Hyper-local flood forecasting for your specific area",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Enter Your Details",
      description:
        "Provide your name, password, and location for personalized monitoring",
    },
    {
      number: "02",
      title: "Location Processing",
      description:
        "Your location is automatically converted to precise coordinates",
    },
    {
      number: "03",
      title: "Get Predictions",
      description:
        "Access your personalized flood prediction dashboard instantly",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-teal-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stay Safe with <span className="text-blue-600">Real-Time</span>
              <br />
              <span className="text-teal-600">Flood Detection</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Get live flood risk predictions, rainfall updates, and instant
              alerts to protect your community with advanced AI-powered
              monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() =>
                  document
                    .getElementById("login-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced technology to keep you informed and protected
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login/Signup Section */}
      <div id="login-section" className="py-20 bg-white">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600">
                Enter your details to access the dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter your city or address"
                    className="w-full px-4 py-3 pr-32 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                  >
                    {isDetectingLocation ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3 mr-1" />
                        Detect
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {coordinates
                    ? `Coordinates: ${coordinates.lat.toFixed(
                        4
                      )}, ${coordinates.lng.toFixed(4)}`
                    : 'Click "Detect" to use your current location or enter manually'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                onClick={trainModel}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Model Training In Progress
                  </div>
                ) : (
                  "Login / Register"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
