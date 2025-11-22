import * as yup from "yup";

export const signupValidation = yup.object({
  name: yup
    .string()
    .min(3, "Type a valid name")
    .required("Please enter a name"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Please enter an email"),
  mobile: yup
    .string()
    .length(10, "Please enter a valid number")
    .required("Please enter an valid number"),
  referred_Code: yup
    .string()
    .min(5, "Enter a valid code")
    .matches(/^(?=.*\d)/, "Enter a valid code"),
});

export const VehicleValidation = yup.object().shape({
  registrationId: yup
    .string()
    .matches(/^[A-Z]{2}\d{2}\s?[A-Z]{0,2}\s?\d{1,4}$/, "Invalid Indian RC format (e.g., MH04 AB 1234)")
    .required("Registration ID is required"),

  vehicleNumber: yup
    .string()
    .matches(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/, "Invalid vehicle number format (e.g., MH04AB1234)")
    .required("Vehicle number is required"),

  vehicleColor: yup.string().required("Vehicle color is required"),

  model: yup.string().required("Vehicle model is required"),

  rcFrontImage: yup
    .mixed()
    .required("RC front image is required")
    .test("fileType", "Only image files are allowed", (value: any) => value && value.type.startsWith("image/"))
    .test("fileSize", "File size must be less than 5MB", (value: any) => value && value.size <= 5 * 1024 * 1024),

  rcBackImage: yup
    .mixed()
    .required("RC back image is required")
    .test("fileType", "Only image files are allowed", (value: any) => value && value.type.startsWith("image/"))
    .test("fileSize", "File size must be less than 5MB", (value: any) => value && value.size <= 5 * 1024 * 1024),

  carFrontImage: yup
    .mixed()
    .required("Vehicle front image is required")
    .test("fileType", "Only image files are allowed", (value: any) => value && value.type.startsWith("image/"))
    .test("fileSize", "File size must be less than 5MB", (value: any) => value && value.size <= 5 * 1024 * 1024),

  carSideImage: yup
    .mixed()
    .required("Vehicle side image is required")
    .test("fileType", "Only image files are allowed", (value: any) => value && value.type.startsWith("image/"))
    .test("fileSize", "File size must be less than 5MB", (value: any) => value && value.size <= 5 * 1024 * 1024),

  rcStartDate: yup
    .date()
    .max(new Date(), "RC start date cannot be in the future")
    .required("RC start date is required"),

  rcExpiryDate: yup
    .date()
    .min(new Date(), "RC expiry date must be in the future")
    .required("RC expiry date is required"),
});


export const SignupLocationValidation= yup.object({
  latitude: yup.number()
      .min(8.4, "Choose a valid location in India")
      .max(37.6, "Choose a valid location in India"),
  longitude: yup.number()
      .min(68.7, "Choose a valid location in India")
      .max(97.25, "Choose a valid location in India"),
})

export const adminValidation= yup.object({
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Please enter an email"),
  password: yup
    .string()
    .matches(/^(?=.*[A-Z])/, "Must include One uppercase letter")
    .matches(/^(?=.*\d)/, "Must include one digit")
    .required("Password is required"),
})


export const loginValidation = yup.object({
      mobile: yup
        .string()
        .length(10, "Enter a valid mobile number")
        .required("please enter the mobile number"),
    })

export const driverImageValidation = yup.object({
        driverImage:yup.mixed().required('Please upload your photo')
})

export const userBlockUnblockValidation =  yup.object({
  reason: yup.string().required("Please provide a valid reason!").min(5, "Enter a valid reason"),
  status: yup.string().required("Please select the status"),
})

export const ResubmissionValidation = (fields: string[] = []) =>
  yup.object().shape({
    aadharID: fields.includes('aadhar')
      ? yup
          .string()
          .matches(/^\d{4}\s?\d{4}\s?\d{4}$/, 'Aadhaar must be a 12-digit number (e.g., 1234 5678 9012)')
          .required('Aadhaar ID is required')
      : yup.string().nullable(),
    aadharFrontImage: fields.includes('aadhar')
      ? yup
          .mixed()
          .required('Aadhaar front image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    aadharBackImage: fields.includes('aadhar')
      ? yup
          .mixed()
          .required('Aadhaar back image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),

    licenseID: fields.includes('license')
      ? yup
          .string()
          .matches(/^[A-Z]{2}\d{2}\s?\d{4}\d{7}$/, 'Invalid Indian driving license format (e.g., MH12 20230012345)')
          .required('License ID is required')
      : yup.string().nullable(),
    licenseFrontImage: fields.includes('license')
      ? yup
          .mixed()
          .required('License front image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    licenseBackImage: fields.includes('license')
      ? yup
          .mixed()
          .required('License back image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    licenseValidity: fields.includes('license')
      ? yup
          .date()
          .min(new Date(), 'License validity date must be in the future')
          .required('License validity date is required')
      : yup.string().nullable(),

    registrationId: fields.includes('registrationId')
      ? yup
          .string()
          .matches(
            /^[A-Z]{2}\d{2}\s?[A-Z]{0,2}\s?\d{1,4}$/,
            'Invalid Indian RC format (e.g., MH04 AB 1234)'
          )
          .required('Registration ID is required')
      : yup.string().nullable(),
    model: fields.includes('model')
      ? yup.string().required('Vehicle model is required')
      : yup.string().nullable(),
    rcFrontImage: fields.includes('rc')
      ? yup
          .mixed()
          .required('RC front image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    rcBackImage: fields.includes('rc')
      ? yup
          .mixed()
          .required('RC back image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    carFrontImage: fields.includes('carImage')
      ? yup
          .mixed()
          .required('Car front image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    carBackImage: fields.includes('carImage')
      ? yup
          .mixed()
          .required('Car back image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),

    insuranceImage: fields.includes('insurance')
      ? yup
          .mixed()
          .required('Insurance image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    insuranceStartDate: fields.includes('insurance')
      ? yup
          .date()
          .max(new Date(), 'Insurance start date cannot be in the future')
          .required('Insurance start date is required')
      : yup.string().nullable(),
    insuranceExpiryDate: fields.includes('insurance')
      ? yup
          .date()
          .min(new Date(), 'Insurance expiry date must be in the future')
          .required('Insurance expiry date is required')
          .test('is-after-start', 'Expiry date must be after start date', function (value:any) {
            const { insuranceStartDate } = this.parent;
            return insuranceStartDate && value ? new Date(value) > new Date(insuranceStartDate) : true;
          })
      : yup.string().nullable(),

    pollutionImage: fields.includes('pollution')
      ? yup
          .mixed()
          .required('Pollution certificate image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),
    pollutionStartDate: fields.includes('pollution')
      ? yup
          .date()
          .max(new Date(), 'Pollution start date cannot be in the future')
          .required('Pollution start date is required')
      : yup.string().nullable(),
    pollutionExpiryDate: fields.includes('pollution')
      ? yup
          .date()
          .min(new Date(), 'Pollution expiry date must be in the future')
          .required('Pollution expiry date is required')
          .test('is-after-start', 'Expiry date must be after start date', function (value:any) {
            const { pollutionStartDate } = this.parent;
            return pollutionStartDate && value ? new Date(value) > new Date(pollutionStartDate) : true;
          })
      : yup.string().nullable(),

    driverImage: fields.includes('driverImage')
      ? yup
          .mixed()
          .required('Driver image is required')
          .test('fileType', 'Only image files are allowed', (value:any) => !value || value.type?.startsWith('image/'))
          .test('fileSize', 'File size must be less than 5MB', (value:any) => !value || value.size <= 5 * 1024 * 1024)
      : yup.mixed().nullable(),

    latitude: fields.includes('location')
      ? yup
          .number()
          .required('Latitude is required')
          .min(8.4, 'Choose a valid location in India')
          .max(37.6, 'Choose a valid location in India')
      : yup.number().nullable(),
    longitude: fields.includes('location')
      ? yup
          .number()
          .required('Longitude is required')
          .min(68.7, 'Choose a valid location in India')
          .max(97.25, 'Choose a valid location in India')
      : yup.number().nullable(),
  });

 export const DriverIdentificationValidation = yup.object().shape({
    aadharID: yup.string()
      .matches(/^\d{4}\s?\d{4}\s?\d{4}$/, "Aadhaar must be a 12-digit number (e.g., 1234 5678 9012)")
      .required("Aadhaar ID is required"),
    aadharFrontImage: yup.mixed()
      .required("Aadhaar front image is required")
      .test("fileType", "Only image files are allowed", (value: any) => value && value.type.startsWith("image/"))
      .test("fileSize", "File size must be less than 5MB", (value:any) => value && value.size <= 5 * 1024 * 1024),
    aadharBackImage: yup.mixed()
      .required("Aadhaar back image is required")
      .test("fileType", "Only image files are allowed", (value:any) => value && value.type.startsWith("image/"))
      .test("fileSize", "File size must be less than 5MB", (value:any) => value && value.size <= 5 * 1024 * 1024),
    licenseID: yup.string()
      .matches(/^[A-Z]{2}\d{2}\s?\d{4}\d{7}$/, "Invalid Indian driving license format (e.g., MH12 20230012345)")
      .required("License ID is required"),
    licenseFrontImage: yup.mixed()
      .required("License front image is required")
      .test("fileType", "Only image files are allowed", (value:any) => value && value.type.startsWith("image/"))
      .test("fileSize", "File size must be less than 5MB", (value:any) => value && value.size <= 5 * 1024 * 1024),
    licenseBackImage: yup.mixed()
      .required("License back image is required")
      .test("fileType", "Only image files are allowed", (value:any) => value && value.type.startsWith("image/"))
      .test("fileSize", "File size must be less than 5MB", (value:any) => value && value.size <= 5 * 1024 * 1024),
    licenseValidity: yup.date()
      .min(new Date(), "License validity date cannot be in the past")
      .required("License validity date is required"),
  });

  export  const InsuranceValidation = yup.object().shape({
    pollutionImage: yup.mixed().required("Pollution certificate image is required"),
    insuranceImage: yup.mixed().required("Insurance image is required"),
    insuranceStartDate: yup.string().required("Insurance start date is required"),
    insuranceExpiryDate: yup.string()
      .required("Insurance expiry date is required")
      .test("is-after-start", "Expiry date must be after start date", function (value) {
        const { insuranceStartDate } = this.parent;
        return insuranceStartDate && value ? new Date(value) > new Date(insuranceStartDate) : true;
      }),
    pollutionStartDate: yup.string().required("Pollution start date is required"),
    pollutionExpiryDate: yup.string()
      .required("Pollution expiry date is required")
      .test("is-after-start", "Expiry date must be after start date", function (value) {
        const { pollutionStartDate } = this.parent;
        return pollutionStartDate && value ? new Date(value) > new Date(pollutionStartDate) : true;
      }),
  });