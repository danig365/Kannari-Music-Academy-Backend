import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

const logoBlanc = require('../../assets/logo/Kannari_Logo_Blanc.png')

const Footer = ({ scrollViewRef }) => {
  const navigation = useNavigation()
  const [showBackToTop, setShowBackToTop] = useState(false)

  const scrollToTop = () => {
    if (scrollViewRef?.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true })
    }
  }

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y
    setShowBackToTop(scrollPosition > 300)
  }

  const handleNavigate = (screen, params = {}) => {
    navigation.navigate(screen, params)
  }

  return (
    <View>
      <View style={styles.footerModern}>
        {/* Footer Top */}
        <View style={styles.footerTop}>
          <View style={styles.footerGrid}>
            {/* Brand Column */}
            <View style={styles.footerColumn}>
              <View style={styles.brandLogo}>
                <Image
                  source={logoBlanc}
                  style={styles.brandLogoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandDescription}>
                Structured Online Music Education for the Modern Musician.
              </Text>
              <Text style={styles.footerTagline}>
                Inspired by the Haitian kanari — a vessel that preserves fresh water — we pour structured musical knowledge into every student.
              </Text>
              <Text style={styles.footerMission}>
                Music from the heart. Music that inspires. Music that grows.
              </Text>
            </View>

            {/* What We Pour */}
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>What We Pour</Text>
              <View style={styles.bulletList}>
                {['Discipline', 'Expression', 'Technique', 'Confidence', 'Artistic identity'].map((item, index) => (
                  <Text key={index} style={styles.bulletItem}>• {item}</Text>
                ))}
              </View>
            </View>

            {/* Our Programs */}
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Our Programs</Text>
              <View style={styles.bulletList}>
                {[
                  'Beginner Foundations',
                  'Intermediate Development',
                  'Advanced Performance Training',
                  'Instrument-Specific Courses',
                  'Live Sessions & Feedback',
                  'Youth & Adult Tracks',
                ].map((item, index) => (
                  <Text key={index} style={styles.bulletItem}>• {item}</Text>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => handleNavigate('AllCourses')}
                style={styles.ctaLink}
              >
                <Text style={styles.ctaLinkText}>View All Courses →</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Links */}
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Quick Links</Text>
              <TouchableOpacity onPress={() => handleNavigate('Home')}>
                <Text style={styles.footerLink}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate('About')}>
                <Text style={styles.footerLink}>Our Story</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate('AllCourses')}>
                <Text style={styles.footerLink}>Explore Courses</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate('Faq')}>
                <Text style={styles.footerLink}>FAQs & Help</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate('Policy')}>
                <Text style={styles.footerLink}>Privacy & Terms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Bottom */}
        <View style={styles.footerBottom}>
          <View style={styles.footerBottomContent}>
            <View style={styles.copyright}>
              <Text style={styles.copyrightText}>© 2026 KANNARI MUSIC ACADEMY. All Rights Reserved.</Text>
            </View>
            <View style={styles.footerMenu}>
              <TouchableOpacity onPress={() => handleNavigate('Home')}>
                <Text style={styles.footerMenuLink}>Start Learning Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigate('AllCourses')}>
                <Text style={styles.footerMenuLink}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Back to Top Button */}
      {showBackToTop && (
        <TouchableOpacity
          style={styles.backToTop}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Text style={styles.backToTopIcon}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  footerModern: {
    backgroundColor: '#1a1a1a',
  },
  footerTop: {
    paddingVertical: 80,
    paddingHorizontal: 20,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  footerGrid: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
  },
  footerColumn: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  brandLogo: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  brandLogoImg: {
    height: 60,
    width: 103,
    alignSelf: 'flex-start',
  },
  brandDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  footerTagline: {
    fontSize: 14,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 12,
  },
  footerMission: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 10,
  },
  ctaLink: {
    marginTop: 16,
  },
  ctaLinkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    borderBottomColor: '#667eea',
    borderBottomWidth: 2,
    paddingBottom: 2,
    display: 'flex',
  },
  footerHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    paddingBottomWidth: 3,
    borderBottomColor: '#667eea',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    paddingVertical: 4,
  },
  footerBottom: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footerBottomContent: {
    flexDirection: 'column',
    gap: 12,
  },
  copyright: {},
  copyrightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerMenu: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  footerMenuLink: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  backToTop: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 50,
    height: 50,
    backgroundColor: '#667eea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(102, 126, 234, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1000,
  },
  backToTopIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
})

export default Footer