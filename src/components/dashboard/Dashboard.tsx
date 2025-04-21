import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Menu, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

type Review = Database['public']['Tables']['reviews']['Row'];

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const ReviewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

export const Dashboard: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    avgResponseTime: 0,
    satisfaction: 0,
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority'>('createdAt');

  useEffect(() => {
    fetchReviews();

    const subscription = supabase
      .channel('reviews_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sortBy, activeFilters]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .order(sortBy, { ascending: false });

      if (activeFilters.length > 0) {
        query = query.in('status', activeFilters);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setReviews(data);
        updateStats(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleCreateReview = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            ...newReview,
            status: 'PENDING',
            userId: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select();

      if (error) throw error;

      setCreateDialogOpen(false);
      setNewReview({ title: '', description: '', priority: 'MEDIUM' });
      fetchReviews();
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const updateStats = (reviews: Review[]) => {
    const pending = reviews.filter(r => r.status === 'PENDING').length;
    const completed = reviews.filter(r => r.status === 'COMPLETED').length;
    
    setStats({
      pending,
      completed,
      avgResponseTime: 2.5,
      satisfaction: 4.8,
    });
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const toggleFilter = (status: string) => {
    setActiveFilters(prev =>
      prev.includes(status)
        ? prev.filter(f => f !== status)
        : [...prev, status]
    );
    handleFilterClose();
  };

  return (
    <Box>
      <ActionBar>
        <Typography variant="h4">Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Review
          </Button>
          <Tooltip title="Filter">
            <IconButton onClick={handleFilterClick}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sort">
            <IconButton
              onClick={() => setSortBy(prev => prev === 'createdAt' ? 'priority' : 'createdAt')}
            >
              <SortIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ActionBar>

      {activeFilters.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          {activeFilters.map(filter => (
            <Chip
              key={filter}
              label={filter}
              onDelete={() => toggleFilter(filter)}
            />
          ))}
        </Box>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Reviews
              </Typography>
              <Typography variant="h4">{stats.pending}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.pending / (stats.pending + stats.completed)) * 100} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Reviews
              </Typography>
              <Typography variant="h4">{stats.completed}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.completed / (stats.pending + stats.completed)) * 100} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Response Time
              </Typography>
              <Typography variant="h4">{stats.avgResponseTime}h</Typography>
              <LinearProgress 
                variant="determinate" 
                value={60} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Satisfaction Score
              </Typography>
              <Typography variant="h4">{stats.satisfaction}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={96} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Reviews
      </Typography>
      
      {reviews.map((review) => (
        <ReviewCard key={review.id}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Typography variant="h6">
                  {review.title}
                </Typography>
                <Typography color="textSecondary">
                  {review.description}
                </Typography>
                <Chip
                  size="small"
                  label={review.priority}
                  color={
                    review.priority === 'HIGH' ? 'error' :
                    review.priority === 'MEDIUM' ? 'warning' : 'success'
                  }
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="textSecondary">
                    Updated {new Date(review.updatedAt).toLocaleString()}
                  </Typography>
                  <Chip
                    label={review.status}
                    color={
                      review.status === 'COMPLETED' ? 'success' :
                      review.status === 'IN_PROGRESS' ? 'warning' : 'default'
                    }
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </ReviewCard>
      ))}

      {/* Create Review Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Review</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newReview.title}
            onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newReview.description}
            onChange={(e) => setNewReview(prev => ({ ...prev, description: e.target.value }))}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newReview.priority}
              label="Priority"
              onChange={(e) => setNewReview(prev => ({
                ...prev,
                priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH'
              }))}
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateReview} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => toggleFilter('PENDING')}>
          Pending
        </MenuItem>
        <MenuItem onClick={() => toggleFilter('IN_PROGRESS')}>
          In Progress
        </MenuItem>
        <MenuItem onClick={() => toggleFilter('COMPLETED')}>
          Completed
        </MenuItem>
      </Menu>
    </Box>
  );
}; 