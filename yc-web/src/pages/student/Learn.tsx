import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LearnCertifyDashboard from '@/components/student/LearnCertifyDashboard';
import Navigation from '@/components/Navigation';

const Learn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <Navigation />
      <LearnCertifyDashboard />
    </>
  );
};

export default Learn;