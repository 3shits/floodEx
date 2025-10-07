import React, { useState, useEffect } from "react";
import { fetchWeatherApi } from "openmeteo";

import {
  AlertTriangle,
  Droplets,
  TrendingUp,
  MapPin,
  Send,
  BarChart3,
  Activity,
  Gauge,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface User {
  name: string;
  location: string;
  lat: number;
  lng: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [preds, setPreds] = useState(0);
  // const mailHandler = () => {
  //   const mailOptions = {
  //     from: "nandipratyusha6@gmail.com",
  //     to: "trishit.org@gmail.com",
  //     subject: "FLOOD ALERT !!!",
  //     text: `${preds}% chance of Flood Evacuate Immediately!!`,
  //   };
  //   try {
  //     transporter.sendMail(mailOptions);
  //     console.log("Email sent successfully");
  //   } catch (error) {
  //     console.error("Error sending email:", error);
  //   }
  // };

  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [alertSent, setAlertSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [temperaure, setTemperature] = useState(0);
  const [preci, setPreci] = useState(0);
  const [wind, setWind] = useState(0);
  const [press, setPress] = useState(0);
  const [spress, setSpress] = useState(0);
  const getData = async (lat: number, lon: number) => {
    const params = {
      latitude: lat,
      longitude: lon,
      daily: [
        "temperature_2m_mean",
        "cloud_cover_mean",
        "precipitation_probability_mean",
        "relative_humidity_2m_mean",
        "pressure_msl_mean",
        "surface_pressure_mean",
        "wind_speed_10m_mean",
      ],
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "precipitation",
        "rain",
        "pressure_msl",
        "surface_pressure",
      ],
      timezone: "auto",
      start_date: "2025-09-13",
      end_date: "2025-09-27",
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    const response = responses[0];

    const latitude = response.latitude();
    const longitude = response.longitude();
    const elevation = response.elevation();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const utcOffsetSeconds = response.utcOffsetSeconds();

    console.log(
      `\nCoordinates: ${latitude}°N ${longitude}°E`,
      `\nElevation: ${elevation}m asl`,
      `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
      `\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`
    );

    const current = response.current()!;
    const daily = response.daily()!;

    const weatherData = {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature_2m: current.variables(0)!.value(),
        relative_humidity_2m: current.variables(1)!.value(),
        wind_speed_10m: current.variables(2)!.value(),
        precipitation: current.variables(3)!.value(),
        rain: current.variables(4)!.value(),
        pressure_msl: current.variables(5)!.value(),
        surface_pressure: current.variables(6)!.value(),
      },
      daily: {
        time: [
          ...Array(
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
          ),
        ].map(
          (_, i) =>
            new Date(
              (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
                1000
            )
        ),
        temperature_2m_mean: daily.variables(0)!.valuesArray(),
        cloud_cover_mean: daily.variables(1)!.valuesArray(),
        precipitation_probability_mean: daily.variables(2)!.valuesArray(),
        relative_humidity_2m_mean: daily.variables(3)!.valuesArray(),
        pressure_msl_mean: daily.variables(4)!.valuesArray(),
        surface_pressure_mean: daily.variables(5)!.valuesArray(),
        wind_speed_10m_mean: daily.variables(6)!.valuesArray(),
      },
    };
    setTemperature(weatherData.current.temperature_2m);
    setPreci(weatherData.current.precipitation);
    setWind(weatherData.current.wind_speed_10m);

    setPress(weatherData.current.precipitation);
    setSpress(weatherData.current.surface_pressure);
  };

  // Mock data for charts
  const pieData = [
    {
      name: "Temperature",
      value: parseFloat(temperaure.toFixed(2)),
      color: "#3B82F6",
    },
    {
      name: "Precipitation",
      value: parseFloat(preci.toFixed(2)),
      color: "#06B6D4",
    },
    { name: "Wind", value: parseFloat(wind.toFixed(2)), color: "#10B981" },
  ];

  const radarData = [
    {
      subject: "Temperature",
      A: parseFloat(temperaure.toFixed(2)),
      fullMark: 100,
    },
    {
      subject: "Precipitation",
      A: parseFloat(preci.toFixed(2)) * 500,
      fullMark: 100,
    },
    { subject: "Wind", A: parseFloat(wind.toFixed(2)) * 10, fullMark: 100 },

    {
      subject: "Pressure",
      A: parseFloat(press.toFixed(2)) * 200,
      fullMark: 100,
    },
    {
      subject: "Surface Pressure",
      A: parseFloat(spress.toFixed(2)) / 50,
      fullMark: 100,
    },
  ];

  const staticData = [
    {
      parameter: "Rainfall",
      value: parseFloat(preci.toFixed(2)),
      unit: "mm",
    },
    {
      parameter: "River Water Level",
      value: parseFloat(press.toFixed(2)),
      unit: "m",
    },
    {
      parameter: "Soil Moisture",
      value: parseFloat((spress / 100).toFixed(2)),
      unit: "%",
    },
  ];

  // useEffect(() => {
  //   // Simulate loading and data fetching
  //   setTimeout(() => {
  //     setFloodPrediction(Math.floor(Math.random() * 100));
  //     setIsLoading(false);
  //   }, 2000);
  // }, []);

  useEffect(() => {
    setTimeout(() => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ lat, lng });
        getData(lat, lng);
        getRiskLevel(lat, lng);

        // Reverse geocoding to get address
      });
      setIsLoading(false);
    }, 2000);
  }, []);

  const getRiskLevel = (lat: number, lng: number) => {
    const url = "http://127.0.0.1:8000/predict";

    // Data to send
    const payload = {
      latitude: lat,
      longitude: lng,
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
        let p = (data.flood_probability * 0.21).toFixed(2);
        setPreds(parseFloat(p) * 100);
      })
      .catch((error) => {
        console.error("Error calling /predict:", error);
      });
  };

  const getrisk = () => {
    if (preds >= 70)
      return {
        level: "High",
        color: "text-red-600",
        bg: "bg-red-100",
        border: "border-red-200",
      };
    if (preds >= 40)
      return {
        level: "Moderate",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        border: "border-yellow-200",
      };
    return {
      level: "Low",
      color: "text-green-600",
      bg: "bg-green-100",
      border: "border-green-200",
    };
  };
  const risk = getrisk();

  const handleSendAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
    // mailHandler();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.location} ({user.lat.toFixed(4)}, {user.lng.toFixed(4)})
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Flood Prediction Card */}
        <div
          className={`${risk.bg} ${risk.border} border-2 rounded-2xl p-8 mb-8 shadow-lg`}
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 ${risk.bg} rounded-full`}>
                <Gauge className={`w-12 h-12 ${risk.color}`} />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{preds}%</h2>
            <p className="text-xl text-gray-700 mb-4">Flood Risk Probability</p>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full ${risk.bg} ${risk.color} font-semibold`}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              {risk.level} Risk Level
            </div>
          </div>
        </div>

        {/* Charts and Data Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
              Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2`}
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-teal-600" />
              Risk Profile
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar
                  name="Risk Level"
                  dataKey="A"
                  stroke="#06B6D4"
                  fill="#06B6D4"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Static Data Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Droplets className="w-6 h-6 mr-2 text-blue-600" />
              Current Readings
            </h3>
            <div className="space-y-4">
              {staticData.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.parameter}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {item.value}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flood Alert Button */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Emergency Alert System
          </h3>
          <p className="text-gray-600 mb-6">
            Send immediate flood alerts to authorities and emergency services
          </p>

          {alertSent ? (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold">
                ✓ Alert sent successfully!
              </p>
            </div>
          ) : null}

          <button
            onClick={handleSendAlert}
            disabled={preds < 50 || alertSent}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg flex items-center justify-center mx-auto ${
              preds >= 50 && !alertSent
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 mr-2" />
            {alertSent ? "Alert Sent" : "Send Flood Alert"}
          </button>

          {preds < 50 && (
            <p className="text-sm text-gray-500 mt-3">
              Alert button is enabled when flood risk ≥ 50%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
