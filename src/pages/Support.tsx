import React, { useState } from 'react';
import { Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const Support: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleViewChange = (view: string) => {
    if (view === 'Dashboard') {
      navigate('/');
    } else if (view === 'Patient Detail') {
      navigate('/patient/bed_01');
    } else if (view === 'Settings') {
      navigate('/settings');
    } else if (view === 'Reports') {
      navigate('/reports');
    } else if (view === 'Help & Support') {
      navigate('/support');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senderName.trim() || !senderEmail.trim() || !chatMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Simple mailto fallback - opens user's email client
      const subject = encodeURIComponent(`Support Request from ${senderName}`);
      const body = encodeURIComponent(
        `From: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${chatMessage}`
      );
      
      window.location.href = `mailto:founders@withflux.ai?subject=${subject}&body=${body}`;

      toast({
        title: "Opening Email Client",
        description: "Your default email application will open with the message.",
      });

      // Clear form
      setChatMessage('');
      setSenderEmail('');
      setSenderName('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-black min-h-screen pl-[27px] pt-10 pr-6 max-md:pl-5">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar activeView="Help & Support" onViewChange={handleViewChange} />
        <main className="w-[83%] ml-5 max-md:w-full max-md:ml-0 pb-16 pr-6">
          <Header />
          <div className="w-full mt-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
              <p className="text-gray-400">We're here to help you 24/7, free of charge</p>
            </div>

            {/* Main grey container */}
            <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-[32px] p-6">
              <div className="space-y-6">
                
                {/* 24/7 Availability Banner */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Always Available</h2>
                      <p className="text-lg text-gray-400">Reach us anytime, 24/7 - Support is completely free</p>
                    </div>
                  </div>
                  <p className="text-white mt-4">
                    Our team is committed to providing exceptional support whenever you need it. 
                    Whether you have questions, need assistance, or want to provide feedback, we're here for you.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    
                    {/* Phone */}
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Phone Support</h3>
                          <p className="text-sm text-gray-400">Call us directly</p>
                        </div>
                      </div>
                      <a 
                        href="tel:+16464188070" 
                        className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        646 418 807 - 0
                      </a>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Email Support</h3>
                          <p className="text-sm text-gray-400">Send us an email</p>
                        </div>
                      </div>
                      <a 
                        href="mailto:founders@withflux.ai" 
                        className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        founders[at]withflux.ai
                      </a>
                    </div>
                  </div>
                </div>

                {/* Founders */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Meet Our Founders</h2>
                  <div className="space-y-4">
                    
                    {/* Tim - CEO */}
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <div className="text-white font-bold text-lg">T</div>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Tim</h3>
                          <p className="text-sm text-gray-400">Founder & CEO</p>
                        </div>
                      </div>
                      <a 
                        href="mailto:tim@withflux.ai" 
                        className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        tim[at]withflux.ai
                      </a>
                    </div>

                    {/* Philipp - CTO */}
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <div className="text-white font-bold text-lg">P</div>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Philipp</h3>
                          <p className="text-sm text-gray-400">Founder & CTO</p>
                        </div>
                      </div>
                      <a 
                        href="mailto:philipp@withflux.ai" 
                        className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        philipp[at]withflux.ai
                      </a>
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Send us a Message</h2>
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-white font-medium mb-2">
                        Your Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full p-4 bg-[rgba(20,21,25,1)] border border-[rgba(64,66,73,1)] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-white font-medium mb-2">
                        Your Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full p-4 bg-[rgba(20,21,25,1)] border border-[rgba(64,66,73,1)] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-white font-medium mb-2">
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="How can we help you?"
                        rows={6}
                        className="w-full p-4 bg-[rgba(20,21,25,1)] border border-[rgba(64,66,73,1)] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-2xl text-white font-medium transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>

                  <p className="text-sm text-gray-400 mt-4 text-center">
                    We typically respond within 24 hours
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