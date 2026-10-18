import { Box, Typography } from "@mui/material";
import { useAuth } from "../../context/useAuth";

const HomeScreen = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: 4, py: 8, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Welcome back, {user?.username}
      </Typography>
      <Typography color="text.secondary">
        Pick a page from the sidebar, or create a new one to start saving links.
      </Typography>
    </Box>
  );
};

export default HomeScreen;
