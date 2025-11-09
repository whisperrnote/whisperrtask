import { createFileRoute } from '@tanstack/react-router'
import { Container, Box, Typography, Button, Card, CardContent, Stack, useTheme } from '@mui/material'
import { Add as AddIcon, Folder as FolderIcon } from '@mui/icons-material'

export const Route = createFileRoute('/workspaces')({ component: WorkspacesPage })

function WorkspacesPage() {
  const theme = useTheme()

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Workspaces
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Organize your projects and teams
            </Typography>
          </Box>
          <Button variant="contained" color="primary" startIcon={<AddIcon />}>
            New Workspace
          </Button>
        </Box>

        {/* Workspaces List */}
        <Card
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: 3,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: 1,
                }}
              >
                <FolderIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Getting Started
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create your first workspace to start organizing tasks
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
