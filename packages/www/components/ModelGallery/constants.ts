const textToImageInputs: Input[] = [
  {
    id: "prompt",
    name: "Prompt",
    type: "textarea",
    defaultValue: "A beautiful landscape with a river and mountains",
    required: true,
    description: "The prompt to generate an image from",
    group: "prompt",
  },
  {
    id: "negative_prompt",
    name: "Negative Prompt",
    type: "textarea",
    required: false,
    description: "The negative prompt to generate an image from",
    defaultValue: "bad quality, low quality, low resolution",
    group: "prompt",
  },
  {
    id: "width",
    name: "Width",
    type: "number",
    required: false,
    description: "The width of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "height",
    name: "Height",
    type: "number",
    required: false,
    description: "The height of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "guidance_scale",
    name: "Guidance Scale",
    type: "number",
    required: false,
    description: "The guidance scale to generate an image from",
    defaultValue: 5,
    group: "settings",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to generate an image from",
    defaultValue: 30,
    group: "settings",
  },
];

const imageToImageInputs: Input[] = [
  {
    id: "prompt",
    name: "Prompt",
    type: "textarea",
    defaultValue: "A beautiful landscape with a river and mountains",
    required: true,
    description: "The prompt to generate an image from",
    group: "prompt",
  },
  {
    id: "negative_prompt",
    name: "Negative Prompt",
    type: "textarea",
    required: false,
    description: "The negative prompt to use for image generation",
    defaultValue: "",
    group: "prompt",
  },
  {
    id: "image",
    name: "Image",
    type: "file",
    required: true,
    description: "The image to modify",
    group: "prompt",
  },
  {
    id: "strength",
    name: "Strength",
    type: "number",
    required: false,
    description: "The strength to use for image generation",
    defaultValue: 0.8,
    group: "settings",
  },
  {
    id: "guidance_scale",
    name: "Guidance Scale",
    type: "number",
    required: false,
    description: "The guidance scale to use for image generation",
    defaultValue: 7.5,
    group: "settings",
  },
  {
    id: "image_guidance_scale",
    name: "Image Guidance Scale",
    type: "number",
    required: false,
    description: "The image guidance scale to use for image generation",
    defaultValue: 1.5,
    group: "settings",
  },

  {
    id: "seed",
    name: "Seed",
    type: "number",
    required: false,
    description: "The seed to use for image generation",
    group: "settings",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to use for image generation",
    defaultValue: 100,
    group: "settings",
  },

  {
    id: "num_images_per_prompt",
    name: "Number of Images per Prompt",
    type: "number",
    required: false,
    description: "The number of images to generate per prompt",
    defaultValue: 1,
    group: "settings",
  },
];

const availableModels: Model[] = [
  {
    id: "RealVisXL_V4.0_Lightning",
    title: "Realistic Vision V4",
    description:
      "A streamlined version of RealVisXL_V4.0, designed for faster inference while still aiming for photorealism.",
    pipline: "Text to Image",
    image: "RealVisXL_V4.0_Lightning.png",
    inputs: textToImageInputs,
  },
  {
    id: "SDXL-Lightning",
    title: "SDXL Lightning",
    description:
      "SDXL-Lightning is a lightning-fast text-to-image generation model.",
    pipline: "Text to Image",
    image: "SDXL-Lightning.jpg",
    inputs: textToImageInputs,
  },
  {
    id: "instruct-pix2pix",
    title: "Instruct Pix2Pix",
    description:
      "A powerful diffusion model that edits images to a high-quality standard based on human-written instructions.",
    pipline: "Image to Image",
    image: "instruct-pix2pix.jpg",
    inputs: imageToImageInputs,
  },
  {
    id: "stable-video-diffusion-img2vid-xt-1-1",
    title: "Stable Video Diffusion",
    description:
      "An updated version of the stable-video-diffusion-img2vid-xt model with enhanced performance.",
    pipline: "Image to Video",
    image: "stable-video-diffusion-img2vid-xt-1-1.gif",
  },
  {
    id: "stable-diffusion-x4-upscaler",
    title: "Stable Diffusion Upscaler",
    description:
      " A text-guided upscaling diffusion model trained on large LAION images ",
    pipline: "Upscale Image",
    image: "stable-diffusion-x4-upscaler.png",
  },
];

type Model = {
  id: string;
  title: string;
  description: string;
  image: string;
  pipline: string;
  inputs?: Input[];
};

type Input = {
  id: string;
  name: string;
  type: string;
  defaultValue?: string | number;
  required: boolean;
  description: string;
  group: string;
};

export { availableModels };
export type { Model };