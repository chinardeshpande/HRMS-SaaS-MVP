import { ReactNode } from 'react';
import { Box, Typography, Paper, alpha, Button } from '@mui/material';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  gradient?: string;
  height?: string | number;
  children?: ReactNode;
}

// Color palette
const colors = {
  primary: '#3B82F6',
  accent: '#A78BFA',
  secondary: '#FCD34D',
};

// Curated professional images for different HR/business contexts
export const bannerImages = {
  employees: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop&q=80', // Team collaboration
  attendance: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=400&fit=crop&q=80', // Clock/time management
  leave: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&q=80', // Vacation/beach
  performance: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop&q=80', // Charts and analytics
  onboarding: '/images/banners/onboarding.png', // Employee onboarding illustration
  exit: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=400&fit=crop&q=80', // Professional handshake
  departments: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=400&fit=crop&q=80', // Business meeting
  dashboard: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop&q=80', // Office workspace
  settings: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop&q=80', // Gears/settings
  hr: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=400&fit=crop&q=80', // HR professional
};

export const PageBanner = ({
  title,
  subtitle,
  imageUrl,
  icon,
  primaryAction,
  secondaryAction,
  gradient = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
  height = '160px',
  children,
}: PageBannerProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        borderRadius: '12px',
        overflow: 'hidden',
        border: 'none',
        position: 'relative',
      }}
    >
      {/* Banner Image Section */}
      <Box
        sx={{
          height,
          background: gradient,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Image (if provided) */}
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: gradient.includes('linear-gradient')
              ? gradient
              : `linear-gradient(135deg, ${alpha(colors.primary, 0.9)} 0%, ${alpha(colors.accent, 0.85)} 100%)`,
            opacity: imageUrl ? 0.3 : 1,
          }}
        />

        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            right: -30,
            top: -30,
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(30px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: -20,
            bottom: -20,
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            filter: 'blur(25px)',
          }}
        />

        {/* Content Overlay */}
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  '& .MuiSvgIcon-root': {
                    fontSize: '26px',
                    color: 'white',
                  },
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  mb: subtitle ? 0.3 : 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 4px 24px rgba(0,0,0,0.6)',
                  fontSize: '1.75rem',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.98)',
                    fontWeight: 600,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 3px 16px rgba(0,0,0,0.6)',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          {(primaryAction || secondaryAction) && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {secondaryAction && (
                <Button
                  variant="outlined"
                  startIcon={secondaryAction.icon}
                  onClick={secondaryAction.onClick}
                  size="small"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    px: 2.5,
                    py: 0.8,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '13px',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  variant="contained"
                  startIcon={primaryAction.icon}
                  onClick={primaryAction.onClick}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    color: colors.primary,
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.8,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '13px',
                    boxShadow: `0 2px 8px ${alpha('#000', 0.15)}`,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.95)',
                      boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
                    },
                  }}
                >
                  {primaryAction.label}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Custom Children Content (e.g., avatar section for employee details) */}
      {children && (
        <Box sx={{ position: 'relative', px: 3, pb: 2.5 }}>
          {children}
        </Box>
      )}
    </Paper>
  );
};
