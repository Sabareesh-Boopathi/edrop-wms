import React, { useEffect, useState } from 'react';
import { getMilestones } from '../services/milestoneService';
import { Milestone } from '../types';

const MilestoneBanner: React.FC = () => {
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    const fetchMilestones = async () => {
      const milestones = await getMilestones();
      if (milestones.length > 0) {
        // For now, just show the latest milestone
        setMilestone(milestones[milestones.length - 1]);
      }
    };

    fetchMilestones();

    const interval = setInterval(fetchMilestones, 60000); // Poll for new milestones every minute

    return () => clearInterval(interval);
  }, []);

  if (!milestone) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'lightblue',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
    }}>
      <p>{milestone.description}</p>
    </div>
  );
};

export default MilestoneBanner;