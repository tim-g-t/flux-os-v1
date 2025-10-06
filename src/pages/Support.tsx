import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Phone, Mail, Clock } from "lucide-react";

const Support = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Help & Support");

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === "Dashboard") navigate("/");
    else if (view === "Patient Detail") navigate("/patient/1");
    else if (view === "Settings") navigate("/settings");
    else if (view === "Help & Support") navigate("/support");
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Support</h1>
            <p className="text-gray-400">We're here to help you 24/7</p>
          </div>

          {/* Main grey container */}
          <div className="bg-[rgba(26,27,32,1)] rounded-lg p-8">
            
            {/* 24/7 Availability Banner */}
            <div className="bg-black rounded-lg p-8 mb-6 border border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Always Here for You</h2>
                  <p className="text-gray-400">24/7 Support - Free of Charge</p>
                </div>
              </div>
              <p className="text-gray-300">
                Our team is available around the clock to answer your questions and provide support. 
                Reach out anytime via phone or email.
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Phone Support */}
              <div className="bg-black rounded-lg p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Phone Support</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">Call us anytime</p>
                  <a 
                    href="tel:+16464188070" 
                    className="text-2xl font-mono text-white hover:text-primary transition-colors block"
                  >
                    646 418 8070
                  </a>
                </div>
              </div>

              {/* Email Support */}
              <div className="bg-black rounded-lg p-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Email Support</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">Reach out to our team</p>
                  <div className="space-y-2">
                    <a 
                      href="mailto:founders@withflux.ai" 
                      className="text-white hover:text-primary transition-colors block"
                    >
                      founders@withflux.ai
                    </a>
                    <div className="pt-2 border-t border-gray-800">
                      <a 
                        href="mailto:tim@withflux.ai" 
                        className="text-sm text-gray-400 hover:text-primary transition-colors block"
                      >
                        tim@withflux.ai <span className="text-gray-600">(Founder & CEO)</span>
                      </a>
                      <a 
                        href="mailto:philipp@withflux.ai" 
                        className="text-sm text-gray-400 hover:text-primary transition-colors block mt-1"
                      >
                        philipp@withflux.ai <span className="text-gray-600">(Founder & CTO)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Support Information */}
            <div className="bg-black rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">How We Can Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Technical Support</h4>
                  <p className="text-gray-400 text-sm">
                    Assistance with platform features, integrations, and troubleshooting.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Clinical Questions</h4>
                  <p className="text-gray-400 text-sm">
                    Questions about risk scores, vital signs monitoring, and clinical workflows.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">General Inquiries</h4>
                  <p className="text-gray-400 text-sm">
                    Licensing, partnerships, feature requests, and general questions.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Support;
