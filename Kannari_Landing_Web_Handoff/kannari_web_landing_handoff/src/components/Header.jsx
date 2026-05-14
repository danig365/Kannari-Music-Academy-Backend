import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
// SafeAreaView handled by App.js root wrapper
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { Bootstrap } from './shared/BootstrapIcon'

const logoNoir = require('../../assets/logo/Kannari_Logo_Noir.png')

const Header = () => {
  const navigation = useNavigation()
  const [teacherLoginStatus, setTeacherLoginStatus] = useState(false)
  const [studentLoginStatus, setStudentLoginStatus] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedDropdown, setExpandedDropdown] = useState(null)

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const teacherStatus = await AsyncStorage.getItem('teacherLoginStatus')
      const studentStatus = await AsyncStorage.getItem('studentLoginStatus')

      setTeacherLoginStatus(teacherStatus === 'true')
      setStudentLoginStatus(studentStatus === 'true')
    } catch (error) {
      console.log(error)
    }
  }

  const handleNavigate = (screen) => {
    setMenuOpen(false)
    setExpandedDropdown(null)
    navigation.navigate(screen)
  }

  const toggleDropdown = (dropdown) => {
    setExpandedDropdown(expandedDropdown === dropdown ? null : dropdown)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Brand */}
        <TouchableOpacity
          style={styles.brandContainer}
          onPress={() => handleNavigate('Home')}
        >
          <Image
            source={logoNoir}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Hamburger Menu */}
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <Text style={styles.closeIcon}>✕</Text>
          ) : (
            <>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Mobile Menu */}
      {menuOpen && (
        <ScrollView style={styles.mobileMenu}>
          {/* Home */}
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('Home')}
          >
            <Bootstrap name="house" size={19} color="#8b929f" style={styles.navIcon} />
            <Text style={styles.navLinkText}>Home</Text>
          </TouchableOpacity>

          {/* Teacher Dropdown */}
          <View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleDropdown('teacher')}
            >
              <Bootstrap name="people" size={20} color="#667eea" style={styles.navIcon} />
              <Text style={styles.navLinkText}>Teacher</Text>
              <Text style={styles.dropdownIcon}>
                {expandedDropdown === 'teacher' ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {expandedDropdown === 'teacher' && (
              <View style={styles.dropdownContent}>
                {!teacherLoginStatus && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('TeacherLogin')}
                    >
                      <Bootstrap name="box-arrow-right" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('TeacherRegister')}
                    >
                      <Bootstrap name="person-badge" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Register</Text>
                    </TouchableOpacity>
                  </>
                )}
                {teacherLoginStatus && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('TeacherDashboard')}
                    >
                      <Bootstrap name="bar-chart-line" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownLogout]}
                      onPress={() => handleNavigate('TeacherLogout')}
                    >
                      <Bootstrap name="box-arrow-right" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Logout</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Student Dropdown */}
          <View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => toggleDropdown('student')}
            >
              <Bootstrap name="person" size={20} color="#4b5563" style={styles.navIcon} />
              <Text style={styles.navLinkText}>Student</Text>
              <Text style={styles.dropdownIcon}>
                {expandedDropdown === 'student' ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {expandedDropdown === 'student' && (
              <View style={styles.dropdownContent}>
                {!studentLoginStatus && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('StudentLogin')}
                    >
                      <Bootstrap name="box-arrow-right" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('StudentRegister')}
                    >
                      <Bootstrap name="person-badge" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Register</Text>
                    </TouchableOpacity>
                  </>
                )}
                {studentLoginStatus && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('StudentDashboard')}
                    >
                      <Bootstrap name="bar-chart-line" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownLogout]}
                      onPress={() => handleNavigate('StudentLogout')}
                    >
                      <Bootstrap name="box-arrow-right" size={18} color="#6b7280" style={styles.dropdownItemIcon} />
                      <Text style={styles.dropdownText}>Logout</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Parent Link */}
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('ParentLogin')}
          >
            <Bootstrap name="people" size={20} color="#4b5563" style={styles.navIcon} />
            <Text style={styles.navLinkText}>Parent</Text>
          </TouchableOpacity>

          {/* Additional Navigation Links */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('AllCourses')}
          >
            <Bootstrap name="book" size={20} color="#4b5563" style={styles.navIcon} />
            <Text style={styles.navLinkText}>Explore Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('About')}
          >
            <Bootstrap name="info-circle" size={20} color="#4b5563" style={styles.navIcon} />
            <Text style={styles.navLinkText}>Our Story</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('Faq')}
          >
            <Bootstrap name="exclamation-circle" size={20} color="#4b5563" style={styles.navIcon} />
            <Text style={styles.navLinkText}>FAQs & Help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => handleNavigate('Policy')}
          >
            <Bootstrap name="shield-lock" size={20} color="#4b5563" style={styles.navIcon} />
            <Text style={styles.navLinkText}>Privacy & Terms</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomColor: 'rgba(102, 126, 234, 0.1)',
    borderBottomWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandContainer: {},
  brandLogo: {
    height: 52,
    width: 90,
  },
  hamburger: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#667eea',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  closeIcon: {
    color: '#667eea',
    fontSize: 22,
    fontWeight: '700',
  },
  hamburgerLine: {
    width: 20,
    height: 2.2,
    backgroundColor: '#667eea',
    marginVertical: 2,
    borderRadius: 1,
  },
  mobileMenu: {
    backgroundColor: '#f7f8fb',
    borderTopColor: 'rgba(102, 126, 234, 0.08)',
    borderTopWidth: 1,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 18,
    maxHeight: 560,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  navLinkIcon: {
    width: 24,
  },
  navIcon: {
    width: 24,
    textAlign: 'center',
  },
  navLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3f4652',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownIcon: {
    fontSize: 13,
    color: '#5d6470',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  dropdownContent: {
    backgroundColor: '#eceff7',
    borderLeftColor: '#667eea',
    borderLeftWidth: 3,
    paddingLeft: 0,
    borderRadius: 10,
    marginHorizontal: 14,
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingLeft: 46,
    gap: 10,
    borderBottomColor: 'rgba(102, 126, 234, 0.1)',
    borderBottomWidth: 1,
  },
  dropdownItemIcon: {
    width: 18,
    textAlign: 'center',
  },
  dropdownLogout: {
    borderBottomWidth: 0,
    borderTopColor: 'rgba(102, 126, 234, 0.1)',
    borderTopWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginVertical: 8,
  },
})

export default Header