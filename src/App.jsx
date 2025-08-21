import React, { useState, useEffect, useRef } from 'react';
// Firebase dan Ikon akan diimpor oleh Vite saat build
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  UserIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon,
  PrinterIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  StarIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  UserCircleIcon,
  KeyIcon,
  CheckBadgeIcon,
  DocumentArrowDownIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/solid';

// --- Konfigurasi dan Inisialisasi Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyDbSF7gMYvbEqoZ9fRdfSO-GEVSwsT6RDQ",
      authDomain: "sisbiko.firebaseapp.com",
      projectId: "sisbiko",
      storageBucket: "sisbiko.appspot.com",
      messagingSenderId: "234431614670",
      appId: "1:234431614670:web:6e90f091d82d77d294ca9f"
    };

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const publicCollectionPath = `/artifacts/${appId}/public/data/`;

// --- PERBAIKAN LOGO DI SINI ---
const logoDepanUrl = "https://i.ibb.co/1Y5zPHc/Logo.png";
const logoDashboardUrl = "https://i.ibb.co/Tx49ztw/Logo-Sekolah.png";


// --- Komponen Animasi Loading ---
const LoadingScreen = ({ message }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
    <div className="flex items-center justify-center text-white text-5xl font-bold">
      <span className="tracking-widest">SISBIK</span>
      <div className="relative h-12 w-12 mx-1 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="absolute h-3 w-3 bg-red-500 rounded-full"></div>
      </div>
    </div>
    <p className="text-white text-lg mt-4">{message}</p>
  </div>
);

// --- Komponen Utama Aplikasi ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    let unsubscribeUser = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeUser();
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, `${publicCollectionPath}users`, currentUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserRole(userData.role);
            setUserName(userData.name);
          } else {
            setUserRole('guest');
          }
          setIsAuthReady(true);
        });
      } else {
        setUserRole(null);
        setUserName(null);
        setIsAuthReady(true);
      }
    });
    
    const initialSignIn = async () => {
      if (!auth.currentUser) {
        try {
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Gagal autentikasi awal:", error);
          setIsAuthReady(true);
        }
      }
    };
    initialSignIn();

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const currentUid = user?.uid;
      if (currentUid) {
        const userDocRef = doc(db, `${publicCollectionPath}users`, currentUid);
        await deleteDoc(userDocRef);
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      showMessage('Gagal keluar, silakan coba lagi.', 'bg-red-500');
    } finally {
      setTimeout(() => {
        setIsLoggingOut(false);
        signInAnonymously(auth).catch(err => console.error("Gagal sign-in anonim otomatis:", err));
      }, 1500);
    }
  };

  const showMessage = (text, bgColor) => {
    setMessage({ text, bgColor });
    setTimeout(() => setMessage(null), 3000);
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleConfirm = () => {
    confirmModal.onConfirm();
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const handleCancel = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  if (!isAuthReady) {
    return <LoadingScreen message="Mempersiapkan aplikasi..." />;
  }
  
  if (isLoggingOut) {
    return <LoadingScreen message="Anda sedang keluar..." />;
  }
  
  return (
    <>
      <MessageModal message={message} />
      <ConfirmationModal confirmModal={confirmModal} onConfirm={handleConfirm} onCancel={handleCancel} />
      {user && userRole && userRole !== 'guest' ? (
        <AuthenticatedApp 
          user={user} 
          userRole={userRole} 
          userName={userName} 
          handleLogout={handleLogout}
          showMessage={showMessage}
          showConfirmModal={showConfirmModal}
        />
      ) : (
        <RoleSelectionScreen showMessage={showMessage} user={user} />
      )}
    </>
  );
}

const AuthenticatedApp = ({ user, userRole, userName, handleLogout, showMessage, showConfirmModal }) => {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [allStudents, setAllStudents] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [allViolations, setAllViolations] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [allViolationRules, setAllViolationRules] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);

    useEffect(() => {
        const collections = {
            students: setAllStudents,
            teachers: setAllTeachers,
            student_violations: setAllViolations,
            student_achievements: setAllAchievements,
            tata_tertib_violations: setAllViolationRules,
            attendance: setAllAttendance,
        };

        const unsubscribers = Object.entries(collections).map(([path, setter]) => 
            onSnapshot(collection(db, `${publicCollectionPath}${path}`), (snapshot) => {
                setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (error) => {
                console.error(`Error fetching ${path}:`, error);
            })
        );

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user.uid]);

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar 
                userRole={userRole} 
                setActiveMenu={setActiveMenu} 
                activeMenu={activeMenu} 
                handleLogout={handleLogout} 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
            />
            <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out md:ml-64">
                <Header 
                    setIsSidebarOpen={setIsSidebarOpen} 
                    userRole={userRole} 
                    userName={userName}
                />
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
                    {renderContent(activeMenu, userRole, userName, user, showMessage, showConfirmModal, allStudents, allTeachers, allViolations, allAchievements, allViolationRules, allAttendance)}
                </main>
                <footer className="p-4 text-xs text-gray-400 text-left">
                    Copyright : harisvanjava@sman1Purwoasri - 2026
                </footer>
            </div>
        </div>
    );
};


// --- Komponen UI Pendukung ---

const MessageModal = ({ message }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white ${message.bgColor} z-50 transition-all duration-300`}>
      {message.text}
    </div>
  );
};

const ConfirmationModal = ({ confirmModal, onConfirm, onCancel }) => {
  if (!confirmModal.isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800">{confirmModal.title}</h3>
        <p className="py-4 text-gray-600">{confirmModal.message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onCancel} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Batal</button>
          <button onClick={onConfirm} className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Hapus</button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ userRole, setActiveMenu, activeMenu, handleLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = {
    'admin': [
      { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'admin_dashboard' },
      { name: 'Input Prestasi', icon: <StarIcon className="h-6 w-6" />, menuKey: 'input_prestasi_admin' },
      { name: 'Input Pelanggaran', icon: <ClipboardDocumentListIcon className="h-6 w-6" />, menuKey: 'input_pelanggaran_admin' },
      { name: 'Data Tata Tertib', icon: <ShieldCheckIcon className="h-6 w-6" />, menuKey: 'tata_tertib' },
      { name: 'Data Prestasi', icon: <StarIcon className="h-6 w-6" />, menuKey: 'data_prestasi_admin' },
      { name: 'Database Siswa', icon: <UserGroupIcon className="h-6 w-6" />, menuKey: 'database_siswa' },
      { name: 'Database Guru', icon: <UserIcon className="h-6 w-6" />, menuKey: 'database_guru' },
      { name: 'Rekap & Print', icon: <PrinterIcon className="h-6 w-6" />, menuKey: 'rekap_print' },
    ],
    'kepalasekolah': [
        { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'kepalasekolah_dashboard' },
        { name: 'Database Siswa', icon: <UserGroupIcon className="h-6 w-6" />, menuKey: 'database_siswa_kepala' },
        { name: 'Database Guru', icon: <UserIcon className="h-6 w-6" />, menuKey: 'database_guru_kepala' },
        { name: 'Rekap & Print', icon: <PrinterIcon className="h-6 w-6" />, menuKey: 'rekap_print_kepala' },
    ],
    'guru': [
        { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'guru_dashboard' },
        { name: 'Input Pelanggaran', icon: <ClipboardDocumentListIcon className="h-6 w-6" />, menuKey: 'input_pelanggaran' },
    ],
    'walikelas': [
        { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'walikelas_dashboard' },
        { name: 'Input Pelanggaran', icon: <ClipboardDocumentListIcon className="h-6 w-6" />, menuKey: 'input_pelanggaran_walikelas' },
        { name: 'Input Prestasi', icon: <StarIcon className="h-6 w-6" />, menuKey: 'input_prestasi' },
        { name: 'Rekap Poin Kelas', icon: <ChartBarIcon className="h-6 w-6" />, menuKey: 'rekap_kelas' },
    ],
    'gurubk': [
        { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'gurubk_dashboard' },
        { name: 'Konsultasi & Penanganan', icon: <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />, menuKey: 'konsultasi_penanganan' },
        { name: 'Rekap Pelanggaran', icon: <ClipboardDocumentListIcon className="h-6 w-6" />, menuKey: 'rekap_pelanggaran_bk' },
        { name: 'Rekap Pembinaan', icon: <AcademicCapIcon className="h-6 w-6" />, menuKey: 'rekap_pembinaan_bk' },
    ],
    'gurupiket': [
        { name: 'Dashboard', icon: <BuildingOffice2Icon className="h-6 w-6" />, menuKey: 'gurupiket_dashboard' },
        { name: 'Absensi Siswa', icon: <CheckBadgeIcon className="h-6 w-6" />, menuKey: 'absensi_siswa' },
    ],
  };

  const currentMenuItems = menuItems[userRole] || [];

  return (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center w-full">
            <img src={logoDashboardUrl} alt="Logo SMAN 1 Purwoasri" className="h-12" />
            <span className="text-xs font-semibold mt-2 text-center text-gray-300">Sistem Informasi Bimbingan Konseling</span>
          </div>
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav>
          <ul>
            {currentMenuItems.map((item) => (
              <li key={item.menuKey} className="mb-2">
                <button
                  onClick={() => { setActiveMenu(item.menuKey); setIsSidebarOpen(false); }}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
                    activeMenu === item.menuKey ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {item.icon}
                  <span className="ml-4 font-medium">{item.name}</span>
                </button>
              </li>
            ))}
            <li className="absolute bottom-4 w-56">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 text-red-400 rounded-lg transition-colors duration-200 hover:bg-red-500 hover:text-white"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                <span className="ml-4 font-medium">Keluar</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

const Header = ({ setIsSidebarOpen, userRole, userName }) => {
    return (
      <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-gray-600">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 capitalize">Dashboard {userRole}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold text-gray-700">{userName || 'Pengguna'}</p>
            <p className="text-sm text-gray-500 capitalize">{userRole}</p>
          </div>
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
        </div>
      </header>
    );
};

// --- Logika Rendering Konten ---

const renderContent = (activeMenu, userRole, userName, user, showMessage, showConfirmModal, allStudents, allTeachers, allViolations, allAchievements, allViolationRules, allAttendance) => {
  const commonProps = { showMessage, showConfirmModal, user, userRole, userName, allStudents, allTeachers, allViolations, allAchievements, allViolationRules, allAttendance };
  
  const roleMenus = {
    'admin': {
        'admin_dashboard': <AdminDashboard {...commonProps} />,
        'input_prestasi_admin': <InputPrestasi {...commonProps} />,
        'input_pelanggaran_admin': <InputPelanggaran {...commonProps} />,
        'tata_tertib': <DataTataTertib {...commonProps} />,
        'data_prestasi_admin': <DataPrestasiAdmin {...commonProps} />,
        'database_siswa': <DatabaseSiswa {...commonProps} />,
        'database_guru': <DatabaseGuru {...commonProps} />,
        'rekap_print': <RekapMenuAdmin {...commonProps} />,
    },
    'kepalasekolah': {
        'kepalasekolah_dashboard': <KepalaSekolahDashboard {...commonProps} />,
        'database_siswa_kepala': <DatabaseSiswa {...commonProps} isReadOnly={true} />,
        'database_guru_kepala': <DatabaseGuru {...commonProps} isReadOnly={true} />,
        'rekap_print_kepala': <RekapMenuAdmin {...commonProps} />,
    },
    'guru': {
        'guru_dashboard': <GuruDashboard {...commonProps} />,
        'input_pelanggaran': <InputPelanggaran {...commonProps} />,
    },
    'walikelas': {
        'walikelas_dashboard': <WaliKelasDashboard {...commonProps} />,
        'input_pelanggaran_walikelas': <InputPelanggaran {...commonProps} />,
        'input_prestasi': <InputPrestasi {...commonProps} />,
        'rekap_kelas': <RekapKelas {...commonProps} />,
    },
    'gurubk': {
        'gurubk_dashboard': <GuruBKDashboard {...commonProps} />,
        'konsultasi_penanganan': <KonsultasiPenanganan {...commonProps} />,
        'rekap_pelanggaran_bk': <RekapPelanggaranBK {...commonProps} />,
        'rekap_pembinaan_bk': <RekapPembinaanBK {...commonProps} />,
    },
    'gurupiket': {
        'gurupiket_dashboard': <GuruPiketDashboard {...commonProps} />,
        'absensi_siswa': <AbsensiSiswa {...commonProps} />,
    },
  };

  return roleMenus[userRole]?.[activeMenu] || roleMenus[userRole]?.[`${userRole}_dashboard`] || <GeneralDashboard {...commonProps} />;
};


// --- Komponen Halaman Spesifik ---

const RoleSelectionScreen = ({ showMessage, user }) => {
    const handleLoginAs = async (selectedRole, name, classData = null) => {
      if (!user) {
          showMessage('Sesi autentikasi tidak ditemukan, silakan muat ulang halaman.', 'bg-red-500');
          return;
      }
      const userDocRef = doc(db, `${publicCollectionPath}users`, user.uid);
      try {
        await setDoc(userDocRef, {
          userId: user.uid,
          role: selectedRole,
          name: name,
          class: classData,
        });
        showMessage(`Berhasil login sebagai ${selectedRole}!`, 'bg-green-500');
      } catch (e) {
        console.error("Gagal menetapkan peran pengguna: ", e);
        showMessage('Gagal login, silakan coba lagi.', 'bg-red-500');
      }
    };
  
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center transform hover:scale-105 transition-transform duration-300">
          <img src={logoDepanUrl} alt="SISBIKO Logo" className="h-20 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang di SISBIKO</h2>
          <p className="text-gray-600 mb-8">Silakan pilih peran Anda untuk masuk ke sistem.</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleLoginAs('admin', 'Admin Utama')} className="py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300">Admin</button>
            <button onClick={() => handleLoginAs('kepalasekolah', 'Kepala Sekolah')} className="py-3 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300">Kepala Sekolah</button>
            <button onClick={() => handleLoginAs('walikelas', 'Budi Santoso', 'XII IPA 1')} className="py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300">Wali Kelas</button>
            <button onClick={() => handleLoginAs('guru', 'Siti Aminah')} className="py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300">Guru</button>
            <button onClick={() => handleLoginAs('gurubk', 'Rina Wijaya')} className="py-3 px-4 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300">Guru BK</button>
            <button onClick={() => handleLoginAs('gurupiket', 'Agus Setiawan')} className="py-3 px-4 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-300">Guru Piket</button>
          </div>
        </div>
      </div>
    );
};
  
const GeneralDashboard = ({ allStudents, allTeachers, allViolations, allAchievements, allViolationRules, userRole, userName }) => {
    
    const studentPoints = allStudents.map(student => {
        const totalViolationPoints = allViolations
            .filter(v => v.studentId === student.id)
            .reduce((sum, v) => sum + (v.points || 0), 0);
        const totalAchievementPoints = allAchievements
            .filter(a => a.studentId === student.id)
            .reduce((sum, a) => sum + (a.points || 0), 0);
        return {
            ...student,
            totalViolationPoints,
            totalAchievementPoints,
            netPoints: totalViolationPoints - totalAchievementPoints,
        };
    });

    const top10Violators = [...studentPoints].sort((a, b) => b.netPoints - a.netPoints).slice(0, 10);
    const top10Achievers = [...studentPoints].sort((a, b) => b.totalAchievementPoints - a.totalAchievementPoints).slice(0, 10);

    const violationCount = allViolations.reduce((acc, v) => {
        const rule = allViolationRules.find(r => r.id === v.violationId);
        if (rule) {
            acc[rule.description] = (acc[rule.description] || 0) + 1;
        }
        return acc;
    }, {});

    const top5Violations = Object.entries(violationCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const StatCard = ({ title, value, icon, color }) => (
        <div className={`bg-white p-5 rounded-xl shadow-md flex items-center justify-between border-l-4 ${color}`}>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border', 'bg').replace('-500', '-100')}`}>
                {React.cloneElement(icon, { className: `h-8 w-8 ${color.replace('border', 'text')}` })}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-3xl font-bold text-gray-800">Selamat Datang, {userName}!</h2>
                <p className="text-gray-600 mt-1">Ini adalah ringkasan aktivitas di sekolah Anda.</p>
            </div>

            {userRole === 'admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Jumlah Siswa" value={allStudents.length} icon={<UserGroupIcon />} color="border-blue-500" />
                    <StatCard title="Jumlah Guru" value={allTeachers.length} icon={<UserIcon />} color="border-green-500" />
                    <StatCard title="Total Pelanggaran" value={allViolations.length} icon={<ClipboardDocumentListIcon />} color="border-red-500" />
                    <StatCard title="Total Prestasi" value={allAchievements.length} icon={<StarIcon />} color="border-yellow-500" />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-gray-700">Peringkat Poin Pelanggaran Siswa</h3>
                    <div className="overflow-y-auto max-h-96">
                        <ul className="divide-y divide-gray-200">
                            {top10Violators.map((student, index) => (
                                <li key={student.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className={`flex-shrink-0 h-8 w-8 rounded-full ${index < 3 ? 'bg-red-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold text-sm`}>{index + 1}</span>
                                        <div className="ml-4">
                                            <p className="font-semibold text-gray-800">{student.name}</p>
                                            <p className="text-sm text-gray-500">{student.class}</p>
                                        </div>
                                    </div>
                                    <span className="text-red-500 font-bold text-lg">{student.netPoints} Poin</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-gray-700">Pelanggaran Terpopuler</h3>
                    <ul className="space-y-4">
                        {top5Violations.map(([label, value], index) => (
                            <li key={index}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-600 truncate">{label}</span>
                                    <span className="text-sm font-bold text-indigo-600">{value} kali</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(value / (top5Violations[0]?.[1] || 1)) * 100}%` }}></div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = (props) => <GeneralDashboard {...props} />;
const KepalaSekolahDashboard = (props) => <GeneralDashboard {...props} />;
const GuruDashboard = (props) => <GeneralDashboard {...props} />;
const WaliKelasDashboard = (props) => <GeneralDashboard {...props} />;
const GuruBKDashboard = (props) => <GeneralDashboard {...props} />;
const GuruPiketDashboard = (props) => <GeneralDashboard {...props} />;

const DatabaseSiswa = ({ allStudents, showMessage, showConfirmModal, isReadOnly = false }) => {
  const [formData, setFormData] = useState({ name: '', nis: '', nisn: '', class: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const classOptions = [
    'X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6', 'X-7', 'X-8', 'X-9', 'X-10',
    'XI-SAINTEK 1', 'XI-SAINTEK 2', 'XI-SAINTEK 3',
    'XI-SAINKES 1', 'XI-SAINKES 2', 'XI-SAINKES 3',
    'XI-EKBIS 1', 'XI-EKBIS 2', 'XI-EKBIS 3',
    'XI-HUM 1',
    'XII-SAINTEK 1', 'XII-SAINTEK 2', 'XII-SAINTEK 3',
    'XII-SAINKES 1', 'XII-SAINKES 2', 'XII-SAINKES 3',
    'XII-EKBIS 1', 'XII-EKBIS 2', 'XII-EKBIS 3',
    'XII-HUM 1'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({ 
      name: student.name || '', 
      nis: student.nis || '', 
      nisn: student.nisn || '', 
      class: student.class || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setFormData({ name: '', nis: '', nisn: '', class: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn || !formData.nis || !formData.class) {
      return showMessage('Semua kolom harus diisi.', 'bg-red-500');
    }

    try {
      if (editingStudent) {
        await updateDoc(doc(db, `${publicCollectionPath}students`, editingStudent.id), formData);
        showMessage('Data siswa berhasil diperbarui!', 'bg-green-500');
      } else {
        await addDoc(collection(db, `${publicCollectionPath}students`), formData);
        showMessage('Data siswa berhasil ditambahkan!', 'bg-green-500');
      }
      handleCancelEdit();
    } catch (error) {
      console.error("Error saving student data: ", error);
      showMessage('Gagal menyimpan data siswa.', 'bg-red-500');
    }
  };

  const handleDelete = (studentId) => {
    showConfirmModal(
      'Hapus Data Siswa',
      'Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          await deleteDoc(doc(db, `${publicCollectionPath}students`, studentId));
          showMessage('Data siswa berhasil dihapus.', 'bg-green-500');
        } catch (error) {
          console.error("Error deleting student: ", error);
          showMessage('Gagal menghapus data siswa.', 'bg-red-500');
        }
      }
    );
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nama,NIS,NISN,Kelas\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      showMessage(`Fitur upload untuk file ${file.name} sedang dalam pengembangan.`, 'bg-blue-500');
    }
  };

  const filteredStudents = allStudents.filter(student =>
    (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.nis || '').includes(searchQuery) ||
    (student.nisn || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Database Siswa</h2>
        {!isReadOnly && (
            <>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru (Manual)'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="nis" className="block text-sm font-medium text-gray-700">NIS</label>
                            <input type="text" name="nis" value={formData.nis} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="nisn" className="block text-sm font-medium text-gray-700">NISN</label>
                            <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="class" className="block text-sm font-medium text-gray-700">Kelas</label>
                            <select name="class" value={formData.class} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                                <option value="">-- Pilih Kelas --</option>
                                {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-center space-x-4">
                            <button type="submit" className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
                                {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                            </button>
                            {editingStudent && (
                                <button type="button" onClick={handleCancelEdit} className="py-2 px-6 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">Upload Data Siswa (Massal)</h3>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleDownloadTemplate} className="flex items-center py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                            Unduh Template
                        </button>
                        <label className="flex items-center py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 cursor-pointer">
                            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                            Upload File CSV
                            <input type="file" onChange={handleFileUpload} accept=".csv" className="hidden" />
                        </label>
                    </div>
                </div>
            </>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md">
            <input
                type="text"
                placeholder="Cari siswa berdasarkan nama, NIS, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 mb-4"
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NISN</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                            {!isReadOnly && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nis}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nisn}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class}</td>
                                {!isReadOnly && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(student)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};


const DatabaseGuru = ({ allTeachers, showMessage, showConfirmModal, isReadOnly = false }) => {
  const [formData, setFormData] = useState({ name: '', nip: '', role: '', password: '' });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({ name: teacher.name || '', nip: teacher.nip || '', role: teacher.role || '', password: '' });
  };

  const handleCancelEdit = () => {
    setEditingTeacher(null);
    setFormData({ name: '', nip: '', role: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.nip || !formData.role) {
      return showMessage('Nama, NIP, dan Peran harus diisi.', 'bg-red-500');
    }
    if (!editingTeacher && !formData.password) {
      return showMessage('Password harus diisi untuk guru baru.', 'bg-red-500');
    }

    try {
      let dataToSave = { ...formData };
      if (editingTeacher && !formData.password) {
        delete dataToSave.password;
      }

      if (editingTeacher) {
        await updateDoc(doc(db, `${publicCollectionPath}teachers`, editingTeacher.id), dataToSave);
        showMessage('Data guru berhasil diperbarui!', 'bg-green-500');
      } else {
        await addDoc(collection(db, `${publicCollectionPath}teachers`), dataToSave);
        showMessage('Data guru berhasil ditambahkan!', 'bg-green-500');
      }
      handleCancelEdit();
    } catch (error) {
      console.error("Error saving teacher data: ", error);
      showMessage('Gagal menyimpan data guru.', 'bg-red-500');
    }
  };

  const handleDelete = (teacherId) => {
    showConfirmModal(
      'Hapus Data Guru',
      'Apakah Anda yakin ingin menghapus data guru ini?',
      async () => {
        try {
          await deleteDoc(doc(db, `${publicCollectionPath}teachers`, teacherId));
          showMessage('Data guru berhasil dihapus.', 'bg-green-500');
        } catch (error) {
          console.error("Error deleting teacher: ", error);
          showMessage('Gagal menghapus data guru.', 'bg-red-500');
        }
      }
    );
  };

  const filteredTeachers = allTeachers.filter(teacher =>
    (teacher.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.nip || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Database Guru</h2>
      {!isReadOnly && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">{editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru (Manual)'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nip" className="block text-sm font-medium text-gray-700">NIP</label>
              <input type="text" id="nip" name="nip" value={formData.nip} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Guru</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" name="password" value={formData.password} placeholder={editingTeacher ? 'Kosongkan jika tidak diubah' : ''} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Peran Sebagai</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                <option value="">-- Pilih Peran --</option>
                <option value="guru">Guru</option>
                <option value="gurubk">Guru BK</option>
                <option value="gurupiket">Guru Piket</option>
                <option value="walikelas">Wali Kelas</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center space-x-4">
              <button type="submit" className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
                {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
              </button>
              {editingTeacher && (
                <button type="button" onClick={handleCancelEdit} className="py-2 px-6 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400">
                  Batal
                </button>
              )}
            </div>
             <p className="md:col-span-2 text-xs text-gray-500 mt-2">
                **Penting**: Fitur password ini hanya untuk penyimpanan data. Sistem login saat ini tidak menggunakan password ini.
            </p>
          </form>
        </div>
      )}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Cari guru berdasarkan nama atau NIP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 mb-4"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                {!isReadOnly && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.nip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{teacher.role}</td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleEdit(teacher)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const PlaceholderComponent = ({ title }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mt-4 text-gray-600">Komponen ini sedang dalam pengembangan.</p>
    </div>
);

const InputPrestasi = (props) => <PlaceholderComponent title="Input Prestasi Siswa" />;
const InputPelanggaran = (props) => <PlaceholderComponent title="Input Pelanggaran/Kejadian" />;
const DataTataTertib = (props) => <PlaceholderComponent title="Data Tata Tertib Pelanggaran" />;
const DataPrestasiAdmin = (props) => <PlaceholderComponent title="Data Prestasi Siswa" />;
const RekapMenuAdmin = (props) => <PlaceholderComponent title="Rekap & Print" />;
const RekapKelas = (props) => <PlaceholderComponent title="Rekap Poin Kelas" />;
const KonsultasiPenanganan = (props) => <PlaceholderComponent title="Konsultasi dan Penanganan" />;
const RekapPelanggaranBK = (props) => <PlaceholderComponent title="Rekapitulasi Pelanggaran" />;
const RekapPembinaanBK = (props) => <PlaceholderComponent title="Rekapitulasi Pembinaan" />;
const AbsensiSiswa = (props) => <PlaceholderComponent title="Absensi Siswa" />;
