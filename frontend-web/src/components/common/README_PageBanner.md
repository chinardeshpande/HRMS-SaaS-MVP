# PageBanner Component Usage Guide

The `PageBanner` component provides a beautiful, reusable banner design pattern for all screens in the HRMS application.

## Features

- **Professional Banner Images**: Curated high-quality images from Unsplash for different HR contexts
- **Gradient Overlays**: Beautiful gradient backgrounds with customizable colors
- **Decorative Elements**: Blurred circles for modern, polished look
- **Flexible Actions**: Support for primary and secondary action buttons
- **Custom Content**: Ability to add custom children (e.g., avatar sections)
- **Responsive Design**: Works seamlessly across all screen sizes

## Available Banner Images

```typescript
import { bannerImages } from '../components/common/PageBanner';

bannerImages.employees     // Team collaboration image
bannerImages.attendance    // Clock/time management image
bannerImages.leave         // Vacation/beach image
bannerImages.performance   // Charts and analytics image
bannerImages.onboarding    // New team member welcome image
bannerImages.exit          // Professional handshake image
bannerImages.departments   // Business meeting image
bannerImages.dashboard     // Office workspace image
bannerImages.settings      // Gears/settings image
bannerImages.hr            // HR professional image
```

## Basic Usage

### Simple Banner (Title + Subtitle)

```typescript
import { PageBanner, bannerImages } from '../components/common/PageBanner';
import { People as PeopleIcon } from '@mui/icons-material';

<PageBanner
  title="Employees"
  subtitle="Manage your team and view employee information"
  imageUrl={bannerImages.employees}
  icon={<PeopleIcon />}
/>
```

### Banner with Actions

```typescript
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';

<PageBanner
  title="Attendance"
  subtitle="Track employee attendance and working hours"
  imageUrl={bannerImages.attendance}
  icon={<AccessTimeIcon />}
  primaryAction={{
    label: 'Mark Attendance',
    icon: <AddIcon />,
    onClick: () => handleMarkAttendance(),
  }}
  secondaryAction={{
    label: 'Export Report',
    icon: <DownloadIcon />,
    onClick: () => handleExport(),
  }}
/>
```

### Banner with Custom Children (Employee Detail Pattern)

```typescript
<PageBanner
  title="John Doe"
  subtitle="VP Engineering • Engineering Department"
  imageUrl={bannerImages.employees}
  icon={<PersonIcon />}
  primaryAction={{
    label: 'Edit Profile',
    icon: <EditIcon />,
    onClick: handleEdit,
  }}
>
  {/* Custom avatar and details section */}
  <Box sx={{ mt: -5 }}>
    <Grid container spacing={2} alignItems="flex-end">
      <Grid item>
        <Avatar sx={{ width: 100, height: 100 }}>JD</Avatar>
      </Grid>
      <Grid item xs>
        <Typography variant="h4">John Doe</Typography>
        <Chip label="EMP001" />
        <Chip label="ACTIVE" color="success" />
      </Grid>
    </Grid>
  </Box>
</PageBanner>
```

### Custom Gradient

```typescript
<PageBanner
  title="Performance Reviews"
  subtitle="View and manage employee performance"
  imageUrl={bannerImages.performance}
  gradient="linear-gradient(135deg, #10B981 0%, #3B82F6 100%)"
  icon={<AssessmentIcon />}
/>
```

### Custom Height

```typescript
<PageBanner
  title="Dashboard"
  subtitle="Welcome back! Here's your overview"
  imageUrl={bannerImages.dashboard}
  height="250px"
  icon={<DashboardIcon />}
/>
```

## Example Implementations

### Employees List Screen

```typescript
import { PageBanner, bannerImages } from '../components/common/PageBanner';
import { People as PeopleIcon, Add as AddIcon } from '@mui/icons-material';

const Employees = () => {
  return (
    <AppLayout>
      <PageBanner
        title="Employees"
        subtitle="Manage your workforce and employee information"
        imageUrl={bannerImages.employees}
        icon={<PeopleIcon />}
        primaryAction={{
          label: 'Add Employee',
          icon: <AddIcon />,
          onClick: () => setOpenDialog(true),
        }}
      />

      {/* Rest of your page content */}
    </AppLayout>
  );
};
```

### Attendance Screen

```typescript
<PageBanner
  title="Attendance Management"
  subtitle="Track and manage employee attendance records"
  imageUrl={bannerImages.attendance}
  icon={<AccessTimeIcon />}
  primaryAction={{
    label: 'Mark Attendance',
    icon: <CheckCircleIcon />,
    onClick: handleMarkAttendance,
  }}
  secondaryAction={{
    label: 'View Reports',
    icon: <AssessmentIcon />,
    onClick: handleViewReports,
  }}
/>
```

### Leave Management Screen

```typescript
<PageBanner
  title="Leave Management"
  subtitle="Manage leave requests and balances"
  imageUrl={bannerImages.leave}
  icon={<BeachAccessIcon />}
  primaryAction={{
    label: 'Apply Leave',
    icon: <AddIcon />,
    onClick: handleApplyLeave,
  }}
/>
```

### Performance Reviews Screen

```typescript
<PageBanner
  title="Performance Reviews"
  subtitle="Track employee performance and conduct reviews"
  imageUrl={bannerImages.performance}
  icon={<AssessmentIcon />}
  primaryAction={{
    label: 'New Review',
    icon: <AddIcon />,
    onClick: handleNewReview,
  }}
  secondaryAction={{
    label: 'Analytics',
    icon: <BarChartIcon />,
    onClick: handleViewAnalytics,
  }}
/>
```

### Onboarding Screen

```typescript
<PageBanner
  title="Employee Onboarding"
  subtitle="Streamline new hire onboarding process"
  imageUrl={bannerImages.onboarding}
  icon={<PersonAddIcon />}
  primaryAction={{
    label: 'Start Onboarding',
    icon: <AddIcon />,
    onClick: handleStartOnboarding,
  }}
/>
```

### Exit Management Screen

```typescript
<PageBanner
  title="Exit Management"
  subtitle="Manage employee exit and offboarding"
  imageUrl={bannerImages.exit}
  icon={<ExitToAppIcon />}
  primaryAction={{
    label: 'Initiate Exit',
    icon: <PersonRemoveIcon />,
    onClick: handleInitiateExit,
  }}
/>
```

## Props API

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Main heading text |
| `subtitle` | `string` | No | - | Secondary text below title |
| `imageUrl` | `string` | No | - | Background image URL (use bannerImages) |
| `icon` | `ReactNode` | No | - | Icon displayed in a badge |
| `primaryAction` | `ActionObject` | No | - | Main action button |
| `secondaryAction` | `ActionObject` | No | - | Secondary action button |
| `gradient` | `string` | No | `primary to accent` | CSS gradient string |
| `height` | `string \| number` | No | `'200px'` | Banner height |
| `children` | `ReactNode` | No | - | Custom content below banner |

### ActionObject

```typescript
{
  label: string;      // Button text
  icon?: ReactNode;   // Optional icon
  onClick: () => void; // Click handler
}
```

## Design Consistency

Using the PageBanner component ensures:

1. **Visual Consistency**: All screens have the same professional look
2. **Brand Identity**: Consistent color palette and design language
3. **User Experience**: Familiar navigation and action patterns
4. **Maintainability**: Single source of truth for banner design
5. **Flexibility**: Easy to customize while maintaining consistency

## Tips

- Always use `bannerImages` constants for images (ensures quality and relevance)
- Keep titles concise (1-3 words)
- Subtitles should be descriptive but brief (under 60 characters)
- Use icons that represent the page content
- Primary actions should be the most common/important action
- Secondary actions are for supporting functionality
