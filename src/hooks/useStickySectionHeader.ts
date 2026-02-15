import { useEffect, useRef, useState } from 'react';

interface SectionRef {
  id: string;
  element: HTMLElement | null;
}

export const useStickySectionHeader = () => {
  const sectionRefs = useRef<SectionRef[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const registerSection = (id: string, element: HTMLElement | null) => {
    if (!element) return;

    const existing = sectionRefs.current.find(ref => ref.id === id);
    if (existing) {
      existing.element = element;
    } else {
      sectionRefs.current.push({ id, element });
    }
  };

  useEffect(() => {
    if (sectionRefs.current.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first section that is in view
        const visibleSection = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleSection) {
          const sectionId = sectionRefs.current.find(
            ref => ref.element === visibleSection.target
          )?.id;
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-1px 0px -99% 0px',
      }
    );

    sectionRefs.current.forEach(ref => {
      if (ref.element) {
        observer.observe(ref.element);
      }
    });

    return () => {
      sectionRefs.current.forEach(ref => {
        if (ref.element) {
          observer.unobserve(ref.element);
        }
      });
    };
  }, []);

  return { activeSection, registerSection };
};
