import React, { useRef, useState, useMemo } from 'react'
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ab from './about.jpg'
import musicHero from '../../../assets/music-hero.jpg'
import whyImg from '../../../assets/WhatsApp Image 2026-04-28 at 3.22.02 PM.jpeg'
import Header from '../Header'
import Footer from '../Footer'

// ─── Static data ──────────────────────────────────────────────────────────────

const METHOD_STEPS = [
  {
    num: '01',
    title: 'Foundations',
    body: 'Build solid technique, music theory, and ear training from day one.',
  },
  {
    num: '02',
    title: 'Development',
    body: 'Deepen expression, style, and musical vocabulary with structured progression.',
  },
  {
    num: '03',
    title: 'Performance',
    body: 'Rehearse, record, and perform — sharing your sound with confidence.',
  },
]

const PROGRAMS = [
  { icon: '🎵', label: 'Beginner Foundations',         level: 'Beginner',     accent: '#c9a84c', desc: 'Your first notes, first rhythms, first wins.' },
  { icon: '🎸', label: 'Instrument-Specific Courses',  level: 'All Levels',   accent: '#3d7ac7', desc: 'Guitar, piano, vocals, percussion and more.' },
  { icon: '🎼', label: 'Intermediate Development',      level: 'Intermediate', accent: '#8a5cf5', desc: 'Theory, improvisation, advanced technique.' },
  { icon: '🎤', label: 'Live Sessions & Feedback',      level: 'All Levels',   accent: '#c96e3d', desc: 'Real-time coaching with Kannari instructors.' },
  { icon: '🏆', label: 'Advanced Performance Training', level: 'Advanced',     accent: '#2ea87e', desc: 'Stage presence, recording, professional mindset.' },
  { icon: '👥', label: 'Youth & Adult Tracks',          level: 'All Ages',     accent: '#c9a84c', desc: 'Tailored pacing for every age group.' },
]

const WHY_BULLETS = [
  { icon: '♩', title: 'Structured Curriculum',    body: 'Clear paths. Measurable milestones. No guesswork.' },
  { icon: '♥', title: 'Heart-Centered Teaching',  body: 'Music from the soul — not just theory on a page.' },
  { icon: '🌍', title: 'Cultural Depth',           body: 'Rooted in heritage. Designed for the global musician.' },
  { icon: '★', title: 'Artistic Development',     body: 'Technique + creativity + performance confidence.' },
]

const JOURNEY_STEPS = [
  { step: 'Beginner',     desc: 'Notes, rhythm, posture' },
  { step: 'Intermediate', desc: 'Theory, style, expression' },
  { step: 'Advanced',     desc: 'Repertoire, improvisation' },
  { step: 'Performer',    desc: 'Stage, studio, confidence' },
]

const QUOTE = {
  text: 'Kannari did not just teach me music. It taught me how to listen, feel, and share — and that changed everything.',
  author: 'Kannari Student, Advanced Track',
}

const TEACHER_BULLETS = [
  'Design your own curriculum & schedule',
  'Access a built-in student management platform',
  'Send audio lessons, assignments & feedback',
  'Track student progress with analytics',
]

// ─── Component ────────────────────────────────────────────────────────────────

const Home = () => {
  const navigation = useNavigation()
  const scrollRef = useRef(null)
  const { width } = useWindowDimensions()
  const [backTop, setBackTop] = useState(false)

  const isSmall  = width < 380
  const isTablet = width >= 768
  const maxW     = isTablet ? 780 : 680

  const pad = useMemo(() => ({
    section:  isTablet ? 80 : isSmall ? 52 : 64,
    hz:       isTablet ? 32 : isSmall ? 16 : 20,
  }), [width])

  const go = (screen) => { try { navigation.navigate(screen) } catch (_) {} }

  return (
    <View style={s.root}>
      <Header />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setBackTop(e.nativeEvent.contentOffset.y > 400)}
        scrollEventThrottle={16}
      >

        {/* ══════════════════════════════════════════════════════════════════
            1. HERO — about.jpg full bleed + dark concert-poster overlay
        ══════════════════════════════════════════════════════════════════ */}
        <ImageBackground
          source={musicHero}
          style={[s.hero, { minHeight: isTablet ? 680 : 580 }]}
          resizeMode="cover"
          imageStyle={s.heroBgImg}
        >
          <View style={s.heroOverlay} />

          {/* decorative giant note */}
          <Text style={s.heroGhostNote} accessibilityHidden>𝄞</Text>

          <View style={[s.heroInner, { paddingHorizontal: pad.hz, maxWidth: maxW }]}>
            <View style={s.heroTopRule} />

            <Text style={s.heroEyebrow}>KANNARI MUSIC ACADEMY</Text>

            <Text style={[s.heroH1, isSmall && { fontSize: 32, lineHeight: 42 }]}>
              Music Poured{'\n'}with Purpose.
            </Text>

            {/* staff-line ornament */}
            <View style={s.staffOrnament}>
              {[0,1,2,3,4].map(i => <View key={i} style={s.staffLineInner} />)}
            </View>

            <Text style={[s.heroTagline, isSmall && { fontSize: 13, lineHeight: 24 }]}>
              Structured online music education for every stage of your journey.{'\n'}
              Inspired by the Haitian <Text style={s.italic}>kanari</Text> — a vessel that keeps water fresh — we pour
              discipline, technique, and artistic identity into every student.
            </Text>

            <View style={[s.heroCtas, isTablet && { flexDirection: 'row', columnGap: 16 }]}>
              <TouchableOpacity style={s.btnGold} onPress={() => go('StudentRegister')} activeOpacity={0.88}>
                <Text style={s.btnGoldTxt}>Start Learning Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnGhostLight, isTablet && { flex: 1 }]} onPress={() => go('AllCourses')} activeOpacity={0.88}>
                <Text style={s.btnGhostLightTxt}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* ══════════════════════════════════════════════════════════════════
            2. PROOF BAR — gold strip, 4 stats
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.proofBar, { paddingHorizontal: pad.hz, paddingVertical: 26 }]}>
          <View style={[s.proofRow, { maxWidth: maxW }]}>
            {[
              { v: '500+',  l: 'Students Enrolled' },
              { v: '20+',   l: 'Courses Available' },
              { v: '100%',  l: 'Online & On-Demand' },
              { v: '∞',     l: 'Lifetime Access' },
            ].map((item, i) => (
              <View key={i} style={s.proofItem}>
                <Text style={s.proofVal}>{item.v}</Text>
                <Text style={s.proofLbl}>{item.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            3. THE KANNARI METHOD — 3 steps on near-black
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.methodSection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center' }}>
            <Text style={s.eyebrowLight}>THE KANNARI METHOD</Text>
            <Text style={[s.headingLight, isSmall && { fontSize: 22 }]}>How We Teach</Text>

            <View style={s.methodSteps}>
              {METHOD_STEPS.map((step, i) => (
                <View key={i} style={s.methodStep}>
                  {/* connector line except last */}
                  {i < METHOD_STEPS.length - 1 && <View style={s.methodConnector} />}
                  <View style={s.methodNumCircle}>
                    <Text style={s.methodNum}>{step.num}</Text>
                  </View>
                  <View style={s.methodTextCol}>
                    <Text style={s.methodTitle}>{step.title}</Text>
                    <Text style={s.methodBody}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            4. OUR PROGRAMS — white bg, 2-col card grid
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.programsSection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center' }}>
            <Text style={s.eyebrowDark}>OUR PROGRAMS</Text>
            <Text style={[s.headingDark, isSmall && { fontSize: 22 }]}>Find Your Track</Text>
            <Text style={s.subDark}>
              Six structured tracks — one for every level, instrument, and goal.
            </Text>

            <View style={[s.programGrid, isTablet && { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14 }]}>
              {PROGRAMS.map((p) => (
                <View key={p.label} style={[s.programCard, isTablet && { width: '47.5%' }, { borderTopColor: p.accent }]}>
                  <Text style={s.programIcon}>{p.icon}</Text>
                  <View style={[s.programLevelBadge, { backgroundColor: p.accent + '22', borderColor: p.accent + '55' }]}>
                    <Text style={[s.programLevelTxt, { color: p.accent }]}>{p.level}</Text>
                  </View>
                  <Text style={s.programLabel}>{p.label}</Text>
                  <Text style={s.programDesc}>{p.desc}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.btnDarkSolid} onPress={() => go('AllCourses')} activeOpacity={0.88}>
              <Text style={s.btnDarkSolidTxt}>Browse All Courses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            5. WHY KANNARI — ivory bg, image left + bullets right (stacked on mobile)
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.whySection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={[{ maxWidth: maxW, width: '100%', alignSelf: 'center' }]}>
            <Text style={s.eyebrowDark}>WHY KANNARI</Text>
            <Text style={[s.headingDark, isSmall && { fontSize: 22 }]}>What Makes Us Different</Text>

            <View style={[s.whyInner, isTablet && { flexDirection: 'row', columnGap: 32, alignItems: 'center' }]}>
              <Image source={whyImg} style={[s.whyImg, isTablet && { width: '44%', height: 360 }]} resizeMode="cover" />

              <View style={[s.whyBullets, isTablet && { flex: 1 }]}>
                {WHY_BULLETS.map((b, i) => (
                  <View key={i} style={s.whyBulletRow}>
                    <View style={s.whyBulletIcon}>
                      <Text style={s.whyBulletIconTxt}>{b.icon}</Text>
                    </View>
                    <View style={s.whyBulletText}>
                      <Text style={s.whyBulletTitle}>{b.title}</Text>
                      <Text style={s.whyBulletBody}>{b.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            6. STUDENT JOURNEY — charcoal bg, horizontal track
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.journeySection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center' }}>
            <Text style={s.eyebrowLight}>YOUR PATH</Text>
            <Text style={[s.headingLight, isSmall && { fontSize: 22 }]}>The Student Journey</Text>

            <View style={s.journeyTrack}>
              {JOURNEY_STEPS.map((j, i) => (
                <View key={i} style={s.journeyStepWrap}>
                  {/* connector */}
                  {i < JOURNEY_STEPS.length - 1 && <View style={s.journeyConnector} />}
                  <View style={s.journeyDot} />
                  <Text style={s.journeyStep}>{j.step}</Text>
                  <Text style={s.journeyDesc}>{j.desc}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.btnGold} onPress={() => go('StudentRegister')} activeOpacity={0.88}>
              <Text style={s.btnGoldTxt}>Begin Your Journey</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            7. VOICES — near-black, single large pull-quote
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.voicesSection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={{ maxWidth: isTablet ? 640 : maxW, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
            <Text style={s.bigQuoteMark}>"</Text>
            <Text style={[s.pullQuote, isSmall && { fontSize: 17, lineHeight: 28 }]}>
              {QUOTE.text}
            </Text>
            <View style={s.quoteRule} />
            <Text style={s.quoteAuthor}>{QUOTE.author}</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            8. TEACH WITH US — deep indigo bg
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.teachSection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center' }}>
            <Text style={s.eyebrowLight}>FOR EDUCATORS</Text>
            <Text style={[s.headingLight, isSmall && { fontSize: 22 }]}>Teach With Kannari</Text>
            <Text style={s.teachSub}>
              Share your gift. Build your roster. Grow your impact — with tools designed for modern online music teaching.
            </Text>

            <View style={s.teachCard}>
              {TEACHER_BULLETS.map((b, i) => (
                <View key={i} style={s.teachBulletRow}>
                  <View style={s.teachCheckCircle}>
                    <Text style={s.teachCheck}>✓</Text>
                  </View>
                  <Text style={s.teachBulletTxt}>{b}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.btnGold} onPress={() => go('TeacherRegister')} activeOpacity={0.88}>
              <Text style={s.btnGoldTxt}>Register as a Teacher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            9. FINAL CTA — gold background
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.ctaSection, { paddingVertical: pad.section, paddingHorizontal: pad.hz }]}>
          {/* decorative ghost notes */}
          <Text style={s.ctaGhostL} accessibilityHidden>♩</Text>
          <Text style={s.ctaGhostR} accessibilityHidden>♫</Text>

          <View style={{ maxWidth: maxW, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
            <Text style={[s.ctaH2, isSmall && { fontSize: 26, lineHeight: 36 }]}>
              Your Musical Journey{'\n'}Starts Today.
            </Text>
            <Text style={s.ctaSub}>
              Join hundreds of students learning online with purpose, structure, and heart.
            </Text>
            <TouchableOpacity style={s.btnDark} onPress={() => go('StudentRegister')} activeOpacity={0.88}>
              <Text style={s.btnDarkTxt}>Enroll Now — It's Free to Start</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            10. FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <Footer />

      </ScrollView>

      {backTop && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.85}
        >
          <Text style={s.fabTxt}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD   = '#c9a84c'
const DARK   = '#0a0a0f'
const CHAR   = '#111318'
const INDIGO = '#141830'
const IVORY  = '#faf5ec'
const WHITE  = '#ffffff'
const GDIM   = '#8a6a10'

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: DARK },
  scroll: { flex: 1 },
  italic: { fontStyle: 'italic' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero:        { width: '100%', justifyContent: 'center', overflow: 'hidden' },
  heroBgImg:   { opacity: 0.45 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,5,12,0.72)' },
  heroGhostNote: {
    position: 'absolute', right: '-5%', bottom: '8%',
    fontSize: 260, lineHeight: 280, color: 'rgba(201,168,76,0.06)',
  },
  heroInner:    { alignItems: 'center', justifyContent: 'center', width: '100%', alignSelf: 'center', paddingTop: 80, paddingBottom: 88 },
  heroTopRule:  { width: 48, height: 3, backgroundColor: GOLD, borderRadius: 2, marginBottom: 20 },
  heroEyebrow:  { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 4, textAlign: 'center', marginBottom: 16 },
  heroH1:       { color: '#f7f0e0', fontSize: 44, lineHeight: 56, fontWeight: '800', textAlign: 'center', marginBottom: 18 },
  staffOrnament:{ width: 120, rowGap: 6, marginBottom: 18 },
  staffLineInner:{ height: 1.5, backgroundColor: 'rgba(201,168,76,0.3)', borderRadius: 1 },
  heroTagline:  { color: '#cec5b4', fontSize: 14, lineHeight: 26, textAlign: 'center', marginBottom: 36, maxWidth: 620 },
  heroCtas:     { width: '100%', rowGap: 14 },

  // ── Shared buttons ────────────────────────────────────────────────────────
  btnGold:        { width: '100%', minHeight: 56, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  btnGoldTxt:     { color: DARK, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  btnGhostLight:  { width: '100%', minHeight: 56, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.5)', backgroundColor: 'rgba(201,168,76,0.08)', alignItems: 'center', justifyContent: 'center' },
  btnGhostLightTxt:{ color: '#f0d078', fontSize: 15, fontWeight: '700' },
  btnDarkSolid:   { marginTop: 28, alignSelf: 'center', width: '100%', maxWidth: 340, minHeight: 56, borderRadius: 12, backgroundColor: CHAR, alignItems: 'center', justifyContent: 'center' },
  btnDarkSolidTxt:{ color: WHITE, fontSize: 15, fontWeight: '700' },
  btnDark:        { width: '100%', maxWidth: 380, minHeight: 58, borderRadius: 14, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', shadowColor: DARK, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6, paddingHorizontal: 12 },
  btnDarkTxt:     { color: GOLD, fontSize: 15, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center' },

  // ── Proof bar ─────────────────────────────────────────────────────────────
  proofBar:  { backgroundColor: GOLD, alignItems: 'center' },
  proofRow:  { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 14 },
  proofItem: { alignItems: 'center', minWidth: 68 },
  proofVal:  { color: DARK, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  proofLbl:  { color: '#4a3800', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },

  // ── Section shared headings ───────────────────────────────────────────────
  eyebrowLight: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 3.5, marginBottom: 10 },
  headingLight: { color: '#f5efe0', fontSize: 26, lineHeight: 34, fontWeight: '800', marginBottom: 24 },
  eyebrowDark:  { color: GDIM, fontSize: 10, fontWeight: '700', letterSpacing: 3.5, marginBottom: 10 },
  headingDark:  { color: CHAR, fontSize: 26, lineHeight: 34, fontWeight: '800', marginBottom: 8 },
  subDark:      { color: '#6a6d7a', fontSize: 13, lineHeight: 22, marginBottom: 28 },

  // ── Method section ────────────────────────────────────────────────────────
  methodSection: { backgroundColor: DARK, alignItems: 'center' },
  methodSteps:   { marginTop: 8, rowGap: 0 },
  methodStep:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 28 },
  methodConnector:{ position: 'absolute', left: 23, top: 48, width: 2, height: 40, backgroundColor: 'rgba(201,168,76,0.3)', zIndex: 0 },
  methodNumCircle:{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,168,76,0.1)', marginRight: 18, flexShrink: 0 },
  methodNum:     { color: GOLD, fontSize: 14, fontWeight: '800' },
  methodTextCol: { flex: 1, paddingTop: 6 },
  methodTitle:   { color: '#f5efe0', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  methodBody:    { color: '#9a9099', fontSize: 13, lineHeight: 22 },

  // ── Programs section ──────────────────────────────────────────────────────
  programsSection: { backgroundColor: WHITE, alignItems: 'center' },
  programGrid:     { width: '100%', rowGap: 14, marginBottom: 4 },
  programCard:     { backgroundColor: '#f7f7fb', borderRadius: 16, padding: 20, borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  programIcon:     { fontSize: 28, lineHeight: 36, marginBottom: 10 },
  programLevelBadge:{ alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  programLevelTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  programLabel:    { color: CHAR, fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  programDesc:     { color: '#767980', fontSize: 13, lineHeight: 20 },

  // ── Why Kannari ───────────────────────────────────────────────────────────
  whySection:     { backgroundColor: IVORY, alignItems: 'center' },
  whyInner:       { width: '100%', rowGap: 28 },
  whyImg:         { width: '100%', height: 240, borderRadius: 18 },
  whyBullets:     { rowGap: 20 },
  whyBulletRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  whyBulletIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16, flexShrink: 0 },
  whyBulletIconTxt:{ fontSize: 20, lineHeight: 24 },
  whyBulletText:  { flex: 1, paddingTop: 2 },
  whyBulletTitle: { color: CHAR, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  whyBulletBody:  { color: '#6a6d7a', fontSize: 13, lineHeight: 21 },

  // ── Journey section ───────────────────────────────────────────────────────
  journeySection: { backgroundColor: CHAR, alignItems: 'center' },
  journeyTrack:   { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, columnGap: 6, marginBottom: 32, justifyContent: 'space-between' },
  journeyStepWrap:{ alignItems: 'center', flex: 1, minWidth: 70 },
  journeyConnector:{ position: 'absolute', top: 12, left: '60%', right: '-40%', height: 2, backgroundColor: 'rgba(201,168,76,0.25)' },
  journeyDot:     { width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, marginBottom: 10 },
  journeyStep:    { color: '#f0e8d8', fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  journeyDesc:    { color: '#8a8490', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // ── Voices section ────────────────────────────────────────────────────────
  voicesSection:  { backgroundColor: '#07070d', alignItems: 'center' },
  bigQuoteMark:   { color: GOLD, fontSize: 100, lineHeight: 80, fontWeight: '800', marginBottom: 8, alignSelf: 'center' },
  pullQuote:      { color: '#ede5d8', fontSize: 20, lineHeight: 34, fontStyle: 'italic', textAlign: 'center', marginBottom: 24 },
  quoteRule:      { width: 48, height: 2, backgroundColor: GOLD, borderRadius: 1, marginBottom: 14 },
  quoteAuthor:    { color: '#7a7480', fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },

  // ── Teach section ─────────────────────────────────────────────────────────
  teachSection: { backgroundColor: INDIGO, alignItems: 'center' },
  teachSub:     { color: '#9a96a8', fontSize: 13, lineHeight: 22, marginBottom: 24 },
  teachCard:    { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 22, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', rowGap: 14 },
  teachBulletRow:{ flexDirection: 'row', alignItems: 'center' },
  teachCheckCircle:{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  teachCheck:   { color: GOLD, fontSize: 14, fontWeight: '800' },
  teachBulletTxt:{ color: '#d6d0c8', fontSize: 14, lineHeight: 22, flex: 1 },

  // ── Final CTA ─────────────────────────────────────────────────────────────
  ctaSection: { backgroundColor: GOLD, alignItems: 'center', overflow: 'hidden' },
  ctaGhostL:  { position: 'absolute', left: '-2%', bottom: '5%', fontSize: 180, lineHeight: 200, color: 'rgba(0,0,0,0.08)' },
  ctaGhostR:  { position: 'absolute', right: '-4%', top: '10%', fontSize: 140, lineHeight: 160, color: 'rgba(0,0,0,0.07)' },
  ctaH2:      { color: DARK, fontSize: 34, lineHeight: 44, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  ctaSub:     { color: '#3e2c00', fontSize: 14, lineHeight: 24, textAlign: 'center', marginBottom: 32 },

  // ── FAB back-to-top ───────────────────────────────────────────────────────
  fab:    { position: 'absolute', right: 18, bottom: 24, width: 50, height: 50, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  fabTxt: { color: DARK, fontSize: 22, lineHeight: 24, fontWeight: '800' },
})

export default Home
