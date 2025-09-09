<!-- src/views/Home.vue -->
<!-- Only one change needed: Update the API call in analyzeUser to use Reddit endpoint. -->
<!-- Replace the axios.get line in the analyzeUser function. Rest of the file stays the same. -->

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { supabase } from '../main'

const handle = ref('')
const loading = ref(false)
const error = ref(null)
const results = ref(null)

async function analyzeUser() {
  loading.value = true
  error.value = null
  try {
    // Updated: Fetch last 20 Reddit posts (was X posts).
    const postsRes = await axios.get(`/.netlify/functions/get-posts?username=${handle.value}`)
    const posts = postsRes.data // Array of post texts (title or selftext).

    // Rest unchanged: Analyze with Grok and save to Supabase.
    const analysisRes = await axios.post(`/.netlify/functions/analyze`, { posts })
    const { sentiments, analysis } = analysisRes.data
    const totalScore = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length

    await supabase.from('analyses').upsert({
      handle: handle.value,
      total_score: totalScore,
      character_analysis: analysis
    })

    results.value = { totalScore: totalScore.toFixed(2), character: analysis }
  } catch (err) {
    error.value = err.message || 'Error analyzing user.'
  } finally {
    loading.value = false
  }
}
</script>