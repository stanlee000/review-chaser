import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Avatar,
  Rating,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';

const Dashboard = () => {
  const stats = [
    {
      value: '156',
      label: 'Total Reviews',
      icon: <StarIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
    },
    {
      value: '78%',
      label: 'Response Rate',
      icon: <TrendingUpIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
    },
    {
      value: '4.8',
      label: 'Average Rating',
      icon: <CheckCircleIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
    },
    {
      value: '23',
      label: 'Pending Requests',
      icon: <EmailIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
    },
  ];

  const recentReviews = [
    {
      id: 1,
      author: 'John Doe',
      rating: 5,
      content: 'Excellent service! The AI-generated review request was perfect.',
      date: '2024-04-11',
    },
    {
      id: 2,
      author: 'Jane Smith',
      rating: 4,
      content: 'Great product, would recommend to others.',
      date: '2024-04-10',
    },
    {
      id: 3,
      author: 'Mike Johnson',
      rating: 5,
      content: 'Outstanding experience with the review generation feature.',
      date: '2024-04-09',
    },
  ];

  return (
    <Box sx={{ 
      py: 3,
      px: 4,
      bgcolor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                bgcolor: '#fff',
              }}
            >
              <Box sx={{ mb: 2 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" component="div" sx={{ 
                mb: 1,
                fontWeight: 600,
                fontSize: { xs: '1.75rem', md: '2rem' }
              }}>
                {stat.value}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Reviews */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: '#fff',
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Recent Reviews
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {recentReviews.map((review) => (
            <Box key={review.id}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: '#1976d2',
                    width: 40,
                    height: 40,
                    mr: 2,
                    fontSize: '1rem',
                  }}
                >
                  {review.author.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                      {review.author}
                    </Typography>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      sx={{ color: '#1976d2' }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {review.content}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review.date}
                  </Typography>
                </Box>
              </Box>
              {review.id !== recentReviews.length && (
                <Box sx={{ 
                  mt: 3, 
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard; 