// University departments, degrees, and shifts data

export const DEPARTMENTS = [
  'Department of Management Sciences',
  'Department of Media And Communication Studies',
  'Department of Psychology',
  'Department of Mathematics',
  'Department of English (UGS)',
  'Department of Computer Science',
  'Department of Islamic Thought & Culture',
  'Department of Software Engineering'
]

export const DEGREES_BY_DEPARTMENT = {
  'Department of Management Sciences': [
    { name: 'BBA (Hons)', shifts: ['Morning', 'Evening'] },
    { name: 'BS Accounting & Finance', shifts: ['Morning'] },
    { name: 'Associate Degree in Business Administration', shifts: ['Morning', 'Evening'] }
  ],
  'Department of Media And Communication Studies': [
    { name: 'BS Mass Communication', shifts: ['Morning', 'Evening'] },
    { name: 'BS Mass Communication (Bridging)', shifts: ['Morning', 'Evening'] }
  ],
  'Department of Psychology': [
    { name: 'BS Psychology (Clinical)', shifts: ['Morning', 'Evening'] }
  ],
  'Department of Mathematics': [
    { name: 'BS Mathematics', shifts: ['Morning'] }
  ],
  'Department of English (UGS)': [
    { name: 'BS English', shifts: ['Morning', 'Evening'] },
    { name: 'BS English (Bridging)', shifts: ['Morning', 'Evening'] },
    { name: 'Associate Degree in English', shifts: ['Morning', 'Evening'] }
  ],
  'Department of Computer Science': [
    { name: 'BSCS', shifts: ['Morning', 'Evening'] },
    { name: 'Associate Degree in Computing', shifts: ['Evening'] },
    { name: 'BS Software Engineering', shifts: ['Morning'] }
  ],
  'Department of Islamic Thought & Culture': [
    { name: 'BS Islamic Studies', shifts: ['Morning'] }
  ],
  'Department of Software Engineering': [
    { name: 'BS Software Engineering', shifts: ['Morning'] }
  ]
}

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8']
export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

// Helper function to get degrees for a department
export const getDegreesForDepartment = (department) => {
  return DEGREES_BY_DEPARTMENT[department] || []
}

// Helper function to get shifts for a specific degree in a department
export const getShiftsForDegree = (department, degreeName) => {
  const degrees = DEGREES_BY_DEPARTMENT[department] || []
  const degree = degrees.find(d => d.name === degreeName)
  return degree ? degree.shifts : []
}

// Helper function to check if profile is complete
export const isProfileComplete = (profile) => {
  return !!(
    profile.rollNumber &&
    profile.department &&
    profile.degree &&
    profile.semester &&
    profile.section &&
    profile.shift
  )
}








