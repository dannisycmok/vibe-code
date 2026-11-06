import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

const drawerWidth = 268;

const navItems = [
  { label: 'Dashboard', path: '/', icon: DashboardRoundedIcon, description: 'Workspace overview' },
  { label: 'Products', path: '/products', icon: Inventory2RoundedIcon, description: 'Catalog management' },
  { label: 'Users', path: '/users', icon: PeopleAltRoundedIcon, description: 'Customer accounts' },
  { label: 'Orders', path: '/orders', icon: ReceiptLongRoundedIcon, description: 'Order history' },
];

function DrawerContent({ pathname, onNavigate }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 3, height: 82 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '12px',
            color: '#fff',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 55%, #0f9f95 130%)',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
          }}
        >
          <StorageRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            CRUD Studio
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.03em' }}>
            Inventory manager
          </Typography>
        </Box>
      </Stack>

      <Divider />

      <List sx={{ px: 1.5, py: 2.5 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1.5, fontWeight: 750, letterSpacing: '0.12em' }}
        >
          Workspace
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
          {navItems.map((item) => {
            const active = item.path === '/'
              ? pathname === '/'
              : pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                selected={active}
                onClick={onNavigate}
                sx={{
                  borderRadius: '11px',
                  minHeight: 46,
                  color: active ? 'primary.main' : 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(79, 70, 229, 0.09)',
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(79, 70, 229, 0.13)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(15, 23, 42, 0.035)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 600 }}
                />
              </ListItemButton>
            );
          })}
        </Stack>
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '14px',
            border: '1px solid #e7ebf2',
            backgroundColor: '#fafbff',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
                boxShadow: '0 0 0 4px rgba(21, 128, 61, 0.1)',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              API workspace
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            React · Express · SQLite
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const currentPage = navItems.find((item) => (
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  ));

  function closeMobileDrawer() {
    setMobileOpen(false);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 0 },
          }}
        >
          <DrawerContent pathname={pathname} onNavigate={closeMobileDrawer} />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid #e7ebf2',
              backgroundColor: '#fff',
            },
          }}
        >
          <DrawerContent pathname={pathname} />
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{
            borderBottom: '1px solid rgba(231, 235, 242, 0.9)',
            backgroundColor: 'rgba(245, 247, 251, 0.88)',
            backdropFilter: 'blur(14px)',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, px: { xs: 2, md: 4 } }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, mr: 1 }}
              aria-label="Open navigation menu"
            >
              <MenuRoundedIcon />
            </IconButton>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>
                Workspace / {currentPage?.label || 'Page'}
              </Typography>
              <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
                {currentPage?.description || 'Inventory workspace'}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              label="Local environment"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                backgroundColor: '#fff',
                border: '1px solid #e7ebf2',
                color: 'text.secondary',
              }}
            />

            <Tooltip title="Admin workspace">
              <Avatar
                sx={{
                  ml: 1.5,
                  width: 36,
                  height: 36,
                  fontSize: '0.8rem',
                  fontWeight: 750,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                }}
              >
                AD
              </Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4.5 }, px: { xs: 2, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
