import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "motion/react";
import type { EducationItem } from "../types";
import { BookOpen } from "lucide-react";
import "./AceternityTimeline.css";

interface AceternityTimelineProps {
  education: EducationItem[];
}

export const AceternityTimeline: React.FC<AceternityTimelineProps> = ({ education }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref, education]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 60%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  return (
    <div className="aceternity-timeline-container" ref={containerRef}>
      <div ref={ref} className="aceternity-timeline-track">
        {education.map((edu, index) => {
          // Extract period (e.g. "ปัจจุบัน", "2564 - 2567")
          const displayPeriod = edu.current ? "ปัจจุบัน" : (edu.period || `ระดับที่ ${index + 1}`);

          return (
            <div
              key={edu.id || index}
              id={`edu-${edu.id || index}`}
              className="aceternity-timeline-item search-scroll-target"
            >
              {/* Left Column: Sticky Node Dot & Period Title */}
              <div className="aceternity-node-col">
                <div className={`aceternity-node-circle ${edu.current ? 'is-current' : ''}`}>
                  <div className="aceternity-node-core" />
                </div>
                <div className="aceternity-node-label">
                  <span className={`aceternity-period-badge ${edu.current ? 'is-current' : ''}`}>
                    {displayPeriod}
                  </span>
                  <div className="aceternity-degree-preview">
                    {edu.degree}
                  </div>
                </div>
              </div>

              {/* Right Column: Educational Card Content */}
              <div className="aceternity-content-col">
                <div className={`aceternity-edu-card notion-card ${edu.current ? 'is-current' : ''}`}>
                  {/* Card Header: Degree Title */}
                  <div className="aceternity-card-header">
                    <h3 className="aceternity-card-degree">
                      {edu.degree}
                    </h3>
                    {edu.current && (
                      <span className="notion-tag notion-tag-blue aceternity-current-pill">
                        กำลังศึกษาอยู่
                      </span>
                    )}
                  </div>

                  {/* Card Body: Logo & Details */}
                  <div className="aceternity-card-body">
                    <div className="aceternity-logo-frame">
                      <img
                        src={edu.logoUrl}
                        alt={edu.institution}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/logo-tnk.jpg";
                        }}
                      />
                    </div>

                    <div className="aceternity-card-info">
                      <h4 className="aceternity-institution-name">
                        {edu.institution}
                      </h4>

                      {edu.institutionEn && (
                        <div className="aceternity-institution-en">
                          {edu.institutionEn}
                        </div>
                      )}

                      {edu.major && (
                        <div className="aceternity-major-pill">
                          <BookOpen size={13} color="#059669" style={{ flexShrink: 0 }} />
                          <span>
                            {edu.major === 'สาขา เทคโนโลยีสารสนเทศ' ? 'แผนกวิชาเทคโนโลยีสารสนเทศ' : edu.major}
                          </span>
                        </div>
                      )}

                      {edu.description && (
                        <p className="aceternity-description">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Beam Line (Aceternity UI Signature) */}
        <div
          style={{ height: `${height}px` }}
          className="aceternity-spine-rail"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="aceternity-spine-laser"
          />
        </div>
      </div>
    </div>
  );
};
export default AceternityTimeline;
