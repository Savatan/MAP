
const IMGBB_API_KEY = '44b436653e1dae8e503c83a3d23e1bee'; 

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Ошибка загрузки изображения');
  }
  
  return data.data.url;
}

export async function uploadMapImage(file) {
  return await uploadToImgBB(file);
}

export async function uploadGrenadeImage(file) {
  return await uploadToImgBB(file);
}

export async function uploadAvatar(userId, file) {
  return await uploadToImgBB(file);
}
