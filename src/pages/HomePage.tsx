import Hero from '../components/Hero';
import About from '../components/About';
import Skills from '../components/Skills';
import Qualifications from '../components/Qualifications';
import Portfolio from '../components/Portfolio';
import BlogPreview from '../components/blog/BlogPreview';
import Contact from '../components/Contact';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Qualifications />
      <Portfolio />
      <BlogPreview />
      <Contact />
    </main>
  );
}
