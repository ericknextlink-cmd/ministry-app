export const kpiData = [
  {
    title: "Total Applications",
    value: "7,498",
    trend: "+12%",
    bgColor: "bg-white",
  },
  {
    title: "Electrical Works",
    value: "3,298",
    trend: "40%",
    bgColor: "bg-red-600",
  },
  {
    title: "Plumbing Works",
    value: "200",
    trend: "2.7%",
    bgColor: "bg-blue-600",
  },
  {
    title: "General Building & Civil Works",
    value: "4,000",
    trend: "53.3%",
    bgColor: "bg-green-600",
  },
];

export const activityData = {
  labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
  datasets: [
    {
      label: "Certificates Issued",
      data: [350, 400, 380, 450, 500, 300, 420, 550, 480, 520, 580, 600],
      backgroundColor: "rgba(12, 74, 110, 0.8)",
      borderRadius: 5,
    },
  ],
};

export const progressData = [
  {
    title: "Electrical",
    value: 60,
    color: "red",
  },
  {
    title: "Plumbing",
    value: 50,
    color: "blue",
  },
  {
    title: "Civil & Construction",
    value: 51,
    color: "green",
  },
];

export const applicationsData = [
  {
    companyName: "B.TECH Ghana Ltd",
    certificateType: "Electrical",
    status: "Approved",
    issuedOn: "01-Mar-2025",
    expiryDate: "01-Mar-2026",
  },
  {
    companyName: "Build Right Ltd",
    certificateType: "Plumbing",
    status: "Pending",
    issuedOn: "--",
    expiryDate: "--",
  },
  {
    companyName: "Pipe Masters Ltd",
    certificateType: "Plumbing",
    status: "Rejected",
    issuedOn: "--",
    expiryDate: "--",
  },
  {
    companyName: "Reason Mega",
    certificateType: "Construct & Civil",
    status: "Approved",
    issuedOn: "15-Feb-2025",
    expiryDate: "15-Feb-2026",
  },
];

