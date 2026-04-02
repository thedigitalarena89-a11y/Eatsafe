import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    icon: 'photo_camera',
    title: 'Scan your food instantly',
    text: 'Point your camera at your meal and let AI do the hard work for you.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ5FAgqkaTwWI9cLYVmfGwinYIy94x8GEVT9rT1OhIqNcRhO5YxrWoluwMy2vwIQbCwWih-O6oIBsNP_JIbFLQbp--KzGqr8pzSKz-QA_RiKcIaLSuBQRAPBcMGLwrlcXAnCrwOptKxSleEMdGxkGFjnHG5D7iAlbRM-Zu8Z-egW11O4RGy2FoMJKhfUNlEtFLmxNK0Tvm6mMj9IwDQnBF9gPObNPYSgwo2FyFwKLFQtFq_87mgtDl8Zn4NnP97K8uB2I0ZHgk04WX'
  },
  {
    icon: 'scale',
    title: 'Detect weight automatically',
    text: 'Seamlessly sync with your smart scale for precision logging without typing.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJbubSm-bU_0kx4fxEdu1fwzrEWo_TlEQ8LDZ8AH81BBWtByKnRQ4ogQljWRiHYx-1aTvqaxD0VKGkpl1teDtjcP9TBgd2wOeUl0AXk9VkJ9jwdzH5SITgg4QKP8vdMJ4kQGGICW5Ze8smGU_XOupGvcDp7SKKlLzLZWOoe-jtsS-NgwvwPk7BVZY0OElIltWacFq4XQt_eSA9EOImbk-1yRGGBiVqeQuoyeTmUWr1jBW_9afbW3uc-bNQjki7HBYU8II57H6mNbtK'
  },
  {
    icon: 'calendar_today',
    title: 'Track daily usage',
    text: 'Keep a chronological history of every calorie and nutrient you consume.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_nZT2LdDWsVzJD1T9GJAnadkh2NonsexH8lUzoHileXvUXDusQKXqjvx3dtS9k6f2DwqhHU-qD6stVN7xCg02NNMcKUZDDqbLO7QxRuen8LSQYVrx1Jey0GHu79F9oMWQsFBpmaFRO1y0i1x8uD9b3Gjs13rgpSHVdiSwA-W4rKtsEodOrCfe0uuPPMUJKauhG4U1jyJ_HDMSX11-a_pibSPnTudeAEgyHiBiMazkndKKGbT5TD-pHA2L7BUdfjb7JXAr0QSZgEGu'
  },
  {
    icon: 'cloud_done',
    title: 'Save your food data',
    text: 'Your personal library of favorite meals and custom ingredients, stored forever.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqz4XW7wtQYIxqWtGpAHQnfRCEXkHoVx08IoWdBclYGvNTLYLHQd0DwTg3GryA5xPS0oE9OqV7xntigQdFROJ3tAY8HSb072fH3u-b_KI_sz614JkzEv88Bcf8hgBgdGwZxr_mXqMTOGW4ju6c6KlRIjnGnMJDKJHlnXF9asESjmTXHLJ_iVN36d-cVRz8cb1mwcZmz6npLOYOja2sF1bN9YhSRK4WCbOlO_AoisyJmOXYU0CuPNLHJgE9-6hpKrliJWTxgTRl8eUY'
  },
  {
    icon: 'trending_up',
    title: 'Stay consistent with insights',
    text: 'Get personalized feedback and trends to help you reach your health goals faster.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Q-ySCyj3SLJyaVr3y-h3xJ_yxKJ0Kg-5TEfR21pvbnlOItmZtD8YqnQdciqPzJIBEVM_tpHHQVvb_95w3jU-_db6LtYNdj4rSCWVAsSv7AkMDbZ7FZh5Y6moE8dDRGDnEU54BKpZTONI094aPyzNFA-jHXG9AzjtTlHu_LZzP8FfdAg3_D65H0WsS-iGjRNXtUsESVgGdkyIgjUvjxQk2dx3BE10BBUgQ1cQHi7pH1AzZ_6B4XcBf7SAz5BdE9Ztd6CPmyqUmiYY'
  }
];

export default function OnboardingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  return (
    <div className="page" style={{
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--surface)',
      maxWidth: '100%'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="flex items-center gap-2">
          <div className="logo-ledger" style={{ width: '28px', height: '28px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--on-primary-container)' }}>scale</span>
          </div>
          <span className="font-headline" style={{ fontSize: '1rem', color: 'var(--primary)' }}>Smart Food</span>
        </div>
      </header>

      {/* Slide Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory'
        }}
      >
        {slides.map((slide, i) => (
          <section
            key={i}
            style={{
              minWidth: '100%',
              scrollSnapAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 40px',
              textAlign: 'center'
            }}
          >
            {/* Image with ambient glow */}
            <div style={{
              width: '100%',
              maxWidth: '280px',
              aspectRatio: '1',
              position: 'relative',
              marginBottom: '40px'
            }}>
              <div style={{
                position: 'absolute',
                inset: -20,
                backgroundColor: 'var(--primary-container)',
                opacity: 0.1,
                borderRadius: '50%',
                filter: 'blur(50px)'
              }} />
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-ambient)',
                  position: 'relative',
                  zIndex: 1
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                right: '-12px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-fab)',
                zIndex: 2
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{slide.icon}</span>
              </div>
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              color: 'var(--on-surface)',
              marginBottom: '12px',
              letterSpacing: '-0.02em'
            }}>{slide.title}</h2>
            <p style={{
              color: 'var(--on-surface-variant)',
              fontSize: '0.875rem',
              maxWidth: '260px',
              opacity: 0.7,
              lineHeight: '1.6'
            }}>{slide.text}</p>
          </section>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={{ padding: '24px 32px 48px' }}>
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === activeIndex ? 'var(--primary)' : 'var(--outline-variant)',
                opacity: i === activeIndex ? 1 : 0.3,
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate('/auth?mode=register')}>
            Get Started
          </button>
          <button className="btn-outline" onClick={() => navigate('/auth?mode=login')}>
            I have an account
          </button>
        </div>
      </div>
    </div>
  );
}
