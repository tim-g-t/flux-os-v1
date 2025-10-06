import React from 'react';
import { LogOut, Key, FileText, Bell, User, Shield, Info } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const handleViewChange = (view: string) => {
    if (view === 'Dashboard') {
      navigate('/');
    } else if (view === 'Patient Detail') {
      navigate('/patient/bed_01');
    } else if (view === 'Reports') {
      navigate('/');
    } else if (view === 'Help & Support') {
      navigate('/support');
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <div className="bg-black min-h-screen pl-[27px] pt-10 pr-6 max-md:pl-5">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <Sidebar activeView="Settings" onViewChange={handleViewChange} />
        <main className="w-[83%] ml-5 max-md:w-full max-md:ml-0 pb-16 pr-6">
          <Header />
          <div className="w-full mt-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Manage your account and application preferences</p>
            </div>

            {/* Main grey container wrapping everything */}
            <div className="bg-[rgba(26,27,32,1)] border border-[rgba(64,66,73,1)] rounded-[32px] p-6">
              <div className="space-y-6">
                {/* Account Settings - BLACK box */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Account</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Profile Information</h3>
                          <p className="text-sm text-gray-400">Update your name and email</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Key className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Change Password</h3>
                          <p className="text-sm text-gray-400">Update your password</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences - BLACK box */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Notifications</h3>
                          <p className="text-sm text-gray-400">Manage notification preferences</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* About & Legal - BLACK box */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">About & Legal</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">License Information</h3>
                          <p className="text-sm text-gray-400">View license details and terms</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">Privacy Policy</h3>
                          <p className="text-sm text-gray-400">Read our privacy policy</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-[rgba(30,31,35,1)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[rgba(26,27,32,1)] rounded-full flex items-center justify-center">
                          <Info className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">About Flux</h3>
                          <p className="text-sm text-gray-400">Version 1.0.0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone - BLACK box with red accents */}
                <div className="bg-black border border-[rgba(64,66,73,1)] rounded-[32px] p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Danger Zone</h2>
                  <div className="space-y-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between p-4 bg-[rgba(20,21,25,1)] rounded-2xl hover:bg-red-900/20 border border-transparent hover:border-red-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center">
                          <LogOut className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-medium">Log Out</h3>
                          <p className="text-sm text-gray-400">Sign out of your account</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
