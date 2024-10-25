"use client";
import { motion } from 'framer-motion'
import { BookOpen, Clock, Target } from 'lucide-react'
import { containerVariants, itemVariants } from '@/lib/animations'

const FeatureCards = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {[
        { icon: BookOpen, title: "Diverse Topics", description: "Choose from a wide range of subjects" },
        { icon: Clock, title: "Flexible Duration", description: "Set the perfect length for your lesson" },
        { icon: Target, title: "Clear Objectives", description: "Define specific goals for each lesson" }
      ].map((item, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transform transition-all duration-300 hover:shadow-2xl"
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6"
          >
            <item.icon className="w-16 h-16 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{item.title}</h3>
          <p className="text-gray-600 text-lg">{item.description}</p>
          <motion.div
            className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mt-6 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

export default FeatureCards